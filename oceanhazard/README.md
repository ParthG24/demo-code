# Ocean Hazard Detection System

A full-stack application for detecting and reporting ocean hazards using machine learning, with real-time updates via WebSockets.

## Features

- **Machine Learning Integration**: Uses Hugging Face transformers for disaster image classification
- **Real-time Updates**: WebSocket integration for live report and hotspot updates
- **File Upload**: Support for images and videos with local storage
- **JWT Authentication**: Secure API endpoints with token-based authentication
- **Hotspot Detection**: DBSCAN clustering algorithm to identify hazard hotspots
- **Responsive Design**: Mobile-first React frontend with Tailwind CSS

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for Python
- **SQLite**: Lightweight database for development
- **Transformers**: Hugging Face ML models for image classification
- **OpenCV**: Video processing and frame extraction
- **scikit-learn**: DBSCAN clustering for hotspot detection
- **WebSockets**: Real-time bidirectional communication

### Frontend
- **React**: Modern JavaScript library for UI
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **WebSocket API**: Native browser WebSocket support

## Quick Start

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python start_server.py
```

### Frontend Setup
```bash
npm install
npm run dev
```

Visit http://localhost:5173 to see the application.

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/reports` - Create new report with file upload
- `GET /api/reports` - Get all reports
- `GET /api/hotspots` - Get all hotspots
- `WS /ws/reports` - Real-time updates

## Machine Learning

Uses `Luwayy/disaster_images_model` to classify:
- Flood
- Tsunami
- Water_Disaster

## Hotspot Detection

DBSCAN clustering identifies hazard hotspots from recent reports, updating every 5 minutes.

## File Storage

Media files stored locally in `backend/media/` directory.

## Development

### Backend
- Main app: `backend/main.py`
- ML integration: `process_image_with_ml()` and `process_video_frames()`
- Hotspot calculation: `calculate_hotspots()`

### Frontend
- Components: `src/components/`
- API service: `src/services/apiService.js`
- Report form: `src/components/ReportForm.jsx`

## Production Notes

- Use environment variables for secrets
- Implement proper authentication
- Use cloud storage (S3)
- Set up proper database
- Configure HTTPS and CORS

## Troubleshooting

- **ML Model**: Ensure transformers and torch installed
- **Port Issues**: Check if ports 8000/5173 are available
- **CORS**: Ensure backend is running
- **File Upload**: Check media directory permissions
