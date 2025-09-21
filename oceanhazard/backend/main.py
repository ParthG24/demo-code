from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
import os
import json
import asyncio
import cv2
import numpy as np
from pathlib import Path
from sklearn.cluster import DBSCAN
from scipy.spatial import ConvexHull
import shutil
import uuid
from PIL import Image
import torch
from transformers import pipeline
import sqlite3
import logging
from contextlib import asynccontextmanager
import base64
from io import BytesIO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = "your-secret-key-here"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# File storage configuration
MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)

# Database configuration
DATABASE_FILE = "disaster_reports.db"

# Global variables for ML model and active WebSocket connections
ml_model = None
active_connections: List[WebSocket] = []

# Pydantic models
class User(BaseModel):
    username: str
    password: str

class Report(BaseModel):
    title: str
    description: str
    event_type: str
    severity: int
    location_name: str
    coordinates: Dict[str, float]
    is_offline_report: bool = False

class Hotspot(BaseModel):
    id: str
    coordinates: List[List[float]]
    center: List[float]
    weighted_score: float
    report_count: int
    created_at: datetime
    updated_at: datetime

# Database setup
def init_database():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Reports table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            event_type TEXT NOT NULL,
            severity INTEGER NOT NULL,
            location_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            media_paths TEXT, -- JSON array of file paths
            ml_hazard_score REAL,
            ml_prediction_label TEXT,
            is_verified BOOLEAN DEFAULT FALSE,
            is_offline_report BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Hotspots table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hotspots (
            id TEXT PRIMARY KEY,
            coordinates TEXT NOT NULL, -- JSON array of coordinates
            center_lat REAL NOT NULL,
            center_lng REAL NOT NULL,
            weighted_score REAL NOT NULL,
            report_count INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# ML Model initialization
def init_ml_model():
    """Initialize the ML model for disaster classification"""
    global ml_model
    try:
        ml_model = pipeline("image-classification", model="Luwayy/disaster_images_model")
        logger.info("ML model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load ML model: {e}")
        ml_model = None

# JWT functions
def create_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Dependency for JWT authentication
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    return payload.get("sub")

# ML Processing functions
def process_image_with_ml(image_path: str) -> Dict[str, Any]:
    """Process image with ML model and return hazard score"""
    global ml_model
    
    if not ml_model:
        return {"is_disaster": False, "label": "No model", "score": 0.0}
    
    try:
        # Load and classify image
        image = Image.open(image_path)
        predictions = ml_model(image)
        
        if predictions:
            top_prediction = predictions[0]
            label = top_prediction['label']
            score = top_prediction['score']
            
            # Check if it's a water disaster
            water_disaster_labels = ['Flood', 'Tsunami', 'Water_Disaster']
            is_disaster = label in water_disaster_labels
            
            logger.info(f"ML Classification: {label} with confidence {score:.4f}")
            return {"is_disaster": is_disaster, "label": label, "score": score}
        
        return {"is_disaster": False, "label": "No prediction", "score": 0.0}
        
    except Exception as e:
        logger.error(f"ML processing error: {e}")
        return {"is_disaster": False, "label": "Error", "score": 0.0}

def process_video_frames(video_path: str, num_frames: int = 5) -> Dict[str, Any]:
    """Sample frames from video and classify each one"""
    global ml_model
    
    if not ml_model:
        return {"is_disaster": False, "label": "No model", "score": 0.0}
    
    try:
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if frame_count == 0:
            return {"is_disaster": False, "label": "Invalid video", "score": 0.0}
        
        # Sample frames evenly
        frame_indices = [int(i * frame_count / num_frames) for i in range(num_frames)]
        
        predictions = []
        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            
            if ret:
                # Convert frame to PIL Image
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(frame_rgb)
                
                # Classify frame
                frame_predictions = ml_model(pil_image)
                if frame_predictions:
                    predictions.append(frame_predictions[0])
        
        cap.release()
        
        if not predictions:
            return {"is_disaster": False, "label": "No frames classified", "score": 0.0}
        
        # Find the most confident disaster prediction
        water_disaster_labels = ['Flood', 'Tsunami', 'Water_Disaster']
        disaster_predictions = [p for p in predictions if p['label'] in water_disaster_labels]
        
        if disaster_predictions:
            best_prediction = max(disaster_predictions, key=lambda x: x['score'])
            return {
                "is_disaster": True,
                "label": best_prediction['label'],
                "score": best_prediction['score']
            }
        else:
            # Return the most confident non-disaster prediction
            best_prediction = max(predictions, key=lambda x: x['score'])
            return {
                "is_disaster": False,
                "label": best_prediction['label'],
                "score": best_prediction['score']
            }
            
    except Exception as e:
        logger.error(f"Video processing error: {e}")
        return {"is_disaster": False, "label": "Error", "score": 0.0}

# Hotspot calculation functions
def calculate_hotspots() -> List[Hotspot]:
    """Calculate hotspots using DBSCAN clustering"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Get reports from the last 24 hours
    cursor.execute('''
        SELECT id, latitude, longitude, ml_hazard_score, created_at
        FROM reports 
        WHERE created_at >= datetime('now', '-24 hours')
        AND ml_hazard_score > 0.5
    ''')
    
    reports = cursor.fetchall()
    conn.close()
    
    if len(reports) < 3:
        return []
    
    # Extract coordinates and scores
    coordinates = []
    scores = []
    report_ids = []
    
    for report in reports:
        report_id, lat, lng, score, created_at = report
        coordinates.append([lat, lng])
        scores.append(score)
        report_ids.append(report_id)
    
    # Convert to numpy arrays
    coords_array = np.array(coordinates)
    scores_array = np.array(scores)
    
    # DBSCAN clustering
    dbscan = DBSCAN(eps=0.01, min_samples=3)  # eps in degrees (~1km)
    cluster_labels = dbscan.fit_predict(coords_array)
    
    hotspots = []
    unique_labels = set(cluster_labels)
    
    for label in unique_labels:
        if label == -1:  # Noise points
            continue
        
        # Get points in this cluster
        cluster_mask = cluster_labels == label
        cluster_coords = coords_array[cluster_mask]
        cluster_scores = scores_array[cluster_mask]
        cluster_report_ids = [report_ids[i] for i in range(len(report_ids)) if cluster_mask[i]]
        
        # Calculate weighted score
        weighted_score = np.average(cluster_scores, weights=cluster_scores)
        
        # Calculate center
        center_lat = np.mean(cluster_coords[:, 0])
        center_lng = np.mean(cluster_coords[:, 1])
        
        # Calculate convex hull
        try:
            hull = ConvexHull(cluster_coords)
            hull_coords = cluster_coords[hull.vertices].tolist()
        except:
            # If convex hull fails, use bounding box
            min_lat, max_lat = cluster_coords[:, 0].min(), cluster_coords[:, 0].max()
            min_lng, max_lng = cluster_coords[:, 1].min(), cluster_coords[:, 1].max()
            hull_coords = [
                [min_lat, min_lng],
                [min_lat, max_lng],
                [max_lat, max_lng],
                [max_lat, min_lng]
            ]
        
        hotspot = Hotspot(
            id=f"hotspot_{label}_{int(datetime.now().timestamp())}",
            coordinates=hull_coords,
            center=[center_lat, center_lng],
            weighted_score=float(weighted_score),
            report_count=len(cluster_report_ids),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        hotspots.append(hotspot)
    
    return hotspots

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove broken connections
                self.disconnect(connection)

manager = ConnectionManager()

# Background task for hotspot calculation and INCOIS alerts
async def hotspot_calculation_task():
    """Background task to calculate and broadcast hotspots and INCOIS alerts"""
    while True:
        try:
            logger.info("Calculating hotspots...")
            hotspots = calculate_hotspots()
            
            # Store hotspots in database
            conn = sqlite3.connect(DATABASE_FILE)
            cursor = conn.cursor()
            
            # Clear old hotspots
            cursor.execute("DELETE FROM hotspots")
            
            # Insert new hotspots
            for hotspot in hotspots:
                cursor.execute('''
                    INSERT INTO hotspots (id, coordinates, center_lat, center_lng, weighted_score, report_count)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    hotspot.id,
                    json.dumps(hotspot.coordinates),
                    hotspot.center[0],
                    hotspot.center[1],
                    hotspot.weighted_score,
                    hotspot.report_count
                ))
            
            conn.commit()
            conn.close()
            
            # Broadcast to WebSocket clients
            hotspot_data = [hotspot.dict() for hotspot in hotspots]
            await manager.broadcast(json.dumps({
                "type": "hotspots_update",
                "data": hotspot_data
            }))
            
            logger.info(f"Broadcasted {len(hotspots)} hotspots")
            
        except Exception as e:
            logger.error(f"Hotspot calculation error: {e}")
        
        # Wait 5 minutes before next calculation
        await asyncio.sleep(300)

# Background task for INCOIS alerts simulation
async def incois_alerts_task():
    """Background task to simulate INCOIS alerts"""
    while True:
        try:
            logger.info("Generating INCOIS alerts...")
            
            # Simulate INCOIS alerts (in production, this would fetch from real INCOIS APIs)
            mock_alerts = [
                {
                    "id": f"tsunami_{int(datetime.now().timestamp())}",
                    "type": "tsunami",
                    "title": "Tsunami Warning",
                    "description": "Potential tsunami activity detected",
                    "severity": 4,
                    "coordinates": {"lat": 13.0827, "lng": 80.2707},
                    "area": "Chennai Coast",
                    "issued_at": datetime.now().isoformat(),
                    "valid_until": (datetime.now() + timedelta(hours=6)).isoformat(),
                    "source": "INCOIS",
                    "is_active": True
                },
                {
                    "id": f"high_waves_{int(datetime.now().timestamp()) + 1}",
                    "type": "high_waves",
                    "title": "High Wave Warning",
                    "description": "High waves expected due to weather conditions",
                    "severity": 3,
                    "coordinates": {"lat": 15.2993, "lng": 73.9124},
                    "area": "Goa Coast",
                    "issued_at": datetime.now().isoformat(),
                    "valid_until": (datetime.now() + timedelta(hours=12)).isoformat(),
                    "source": "INCOIS",
                    "is_active": True
                }
            ]
            
            # Broadcast to WebSocket clients
            await manager.broadcast(json.dumps({
                "type": "incois_alerts_update",
                "data": mock_alerts
            }))
            
            logger.info(f"Broadcasted {len(mock_alerts)} INCOIS alerts")
            
        except Exception as e:
            logger.error(f"INCOIS alerts error: {e}")
        
        # Wait 30 minutes before next update (INCOIS updates are less frequent)
        await asyncio.sleep(1800)

# Lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("Starting up...")
    init_database()
    init_ml_model()
    
    # Start background tasks
    hotspot_task = asyncio.create_task(hotspot_calculation_task())
    incois_task = asyncio.create_task(incois_alerts_task())
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    hotspot_task.cancel()
    incois_task.cancel()
    try:
        await hotspot_task
        await incois_task
    except asyncio.CancelledError:
        pass

# Create FastAPI app
app = FastAPI(lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
@app.post("/api/auth/login")
async def login(user: User):
    """Simple login endpoint - in production, verify against database"""
    # For demo purposes, accept any username/password
    access_token = create_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Report endpoints
@app.post("/api/reports")
async def create_report(
    title: str = Form(...),
    description: str = Form(...),
    event_type: str = Form(...),
    severity: int = Form(...),
    location_name: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    is_offline_report: bool = Form(False),
    media_files: List[UploadFile] = File(None),
    current_user: str = Depends(get_current_user)
):
    """Create a new report with optional media files"""
    try:
        media_paths = []
        ml_results = []
        
        # Process media files
        if media_files:
            for media_file in media_files:
                if media_file.filename:
                    # Generate unique filename
                    file_extension = Path(media_file.filename).suffix
                    unique_filename = f"{uuid.uuid4()}{file_extension}"
                    file_path = MEDIA_DIR / unique_filename
                    
                    # Save file
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(media_file.file, buffer)
                    
                    media_paths.append(str(file_path))
                    
                    # Process with ML model
                    if file_extension.lower() in ['.jpg', '.jpeg', '.png']:
                        ml_result = process_image_with_ml(str(file_path))
                        ml_results.append(ml_result)
                    elif file_extension.lower() in ['.mp4', '.avi', '.mov']:
                        ml_result = process_video_frames(str(file_path))
                        ml_results.append(ml_result)
        
        # Calculate average ML score
        ml_hazard_score = 0.0
        ml_prediction_label = "No prediction"
        
        if ml_results:
            disaster_scores = [r["score"] for r in ml_results if r["is_disaster"]]
            if disaster_scores:
                ml_hazard_score = max(disaster_scores)
                best_result = max([r for r in ml_results if r["is_disaster"]], key=lambda x: x["score"])
                ml_prediction_label = best_result["label"]
        
        # Store in database
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO reports (
                title, description, event_type, severity, location_name, 
                latitude, longitude, media_paths, ml_hazard_score, ml_prediction_label,
                is_offline_report
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            title, description, event_type, severity, location_name,
            latitude, longitude, json.dumps(media_paths), ml_hazard_score, 
            ml_prediction_label, is_offline_report
        ))
        
        report_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Prepare response
        response_data = {
            "id": report_id,
            "title": title,
            "description": description,
            "event_type": event_type,
            "severity": severity,
            "location_name": location_name,
            "coordinates": {"lat": latitude, "lng": longitude},
            "media_paths": media_paths,
            "ml_hazard_score": ml_hazard_score,
            "ml_prediction_label": ml_prediction_label,
            "is_offline_report": is_offline_report,
            "created_at": datetime.now().isoformat()
        }
        
        # Broadcast to WebSocket clients
        await manager.broadcast(json.dumps({
            "type": "new_report",
            "data": response_data
        }))
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error creating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports")
async def get_reports(
    limit: int = 100,
    offset: int = 0,
    current_user: str = Depends(get_current_user)
):
    """Get all reports"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, description, event_type, severity, location_name, 
               latitude, longitude, media_paths, ml_hazard_score, ml_prediction_label,
               is_verified, is_offline_report, created_at
        FROM reports 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    ''', (limit, offset))
    
    reports = cursor.fetchall()
    conn.close()
    
    result = []
    for report in reports:
        media_paths = json.loads(report[8]) if report[8] else []
        result.append({
            "id": report[0],
            "title": report[1],
            "description": report[2],
            "event_type": report[3],
            "severity": report[4],
            "location_name": report[5],
            "coordinates": {"lat": report[6], "lng": report[7]},
            "media_paths": media_paths,
            "ml_hazard_score": report[9],
            "ml_prediction_label": report[10],
            "is_verified": bool(report[11]),
            "is_offline_report": bool(report[12]),
            "created_at": report[13]
        })
    
    return result

@app.get("/api/reports/bounds")
async def get_reports_by_bounds(
    north: float,
    south: float,
    east: float,
    west: float,
    current_user: str = Depends(get_current_user)
):
    """Get reports within geographic bounds"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, description, event_type, severity, location_name, 
               latitude, longitude, media_paths, ml_hazard_score, ml_prediction_label,
               is_verified, is_offline_report, created_at
        FROM reports 
        WHERE latitude BETWEEN ? AND ? 
        AND longitude BETWEEN ? AND ?
        ORDER BY created_at DESC
    ''', (south, north, west, east))
    
    reports = cursor.fetchall()
    conn.close()
    
    result = []
    for report in reports:
        media_paths = json.loads(report[8]) if report[8] else []
        result.append({
            "id": report[0],
            "title": report[1],
            "description": report[2],
            "event_type": report[3],
            "severity": report[4],
            "location_name": report[5],
            "coordinates": {"lat": report[6], "lng": report[7]},
            "media_paths": media_paths,
            "ml_hazard_score": report[9],
            "ml_prediction_label": report[10],
            "is_verified": bool(report[11]),
            "is_offline_report": bool(report[12]),
            "created_at": report[13]
        })
    
    return result

# Hotspot endpoints
@app.get("/api/hotspots")
async def get_hotspots(current_user: str = Depends(get_current_user)):
    """Get all hotspots"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, coordinates, center_lat, center_lng, weighted_score, report_count, created_at
        FROM hotspots 
        ORDER BY weighted_score DESC
    ''')
    
    hotspots = cursor.fetchall()
    conn.close()
    
    result = []
    for hotspot in hotspots:
        result.append({
            "id": hotspot[0],
            "coordinates": json.loads(hotspot[1]),
            "center": {"lat": hotspot[2], "lng": hotspot[3]},
            "weighted_score": hotspot[4],
            "report_count": hotspot[5],
            "created_at": hotspot[6]
        })
    
    return result

# WebSocket endpoint
@app.websocket("/ws/reports")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            # Echo back to show connection is alive
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)