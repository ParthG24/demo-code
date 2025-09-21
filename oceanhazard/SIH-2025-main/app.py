from flask import Flask, request, jsonify, render_template
import os
from werkzeug.utils import secure_filename
from disaster_classifier import is_water_disaster


app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


disaster_locations = []

def allowed_file(filename):
    """Checks if the uploaded file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Renders the main HTML page."""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Handles the image upload, classification, and location storage.
    """
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    file = request.files['file']

    # If the user does not select a file, the browser submits an empty file without a filename.
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Get geolocation data from the form
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    if not latitude or not longitude:
        return jsonify({'error': 'Geolocation data is missing'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Ensure the upload directory exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Call the image classification function from your script
        is_disaster, label, score = is_water_disaster(filepath)

        # Clean up the uploaded file
        os.remove(filepath)

        if is_disaster:
            # If it's a disaster, store the location.
            location_data = {
                'lat': float(latitude),
                'lng': float(longitude),
                'label': label,
                'score': score
            }
            disaster_locations.append(location_data)

            # --- Firebase Firestore Integration Example ---
            # In a real app, you would save this to Firestore like this:
            #
            # doc_ref = db.collection('disaster_reports').document()
            # doc_ref.set({
            #     'location': firestore.GeoPoint(float(latitude), float(longitude)),
            #     'label': label,
            #     'score': score,
            #     'timestamp': firestore.SERVER_TIMESTAMP
            # })
            # ---------------------------------------------

        return jsonify({
            'is_disaster': is_disaster,
            'label': label,
            'score': f'{score:.2f}'
        })

    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/locations', methods=['GET'])
def get_locations():
    """Provides the list of detected disaster locations to the frontend."""
    # --- Firebase Firestore Data Fetching Example ---
    # In a real app, you would fetch data from Firestore:
    #
    # reports_ref = db.collection('disaster_reports').stream()
    # locations = []
    # for report in reports_ref:
    #     data = report.to_dict()
    #     locations.append({
    #         'lat': data['location'].latitude,
    #         'lng': data['location'].longitude,
    #         'label': data['label']
    #     })
    # return jsonify(locations)
    # ------------------------------------------------
    return jsonify(disaster_locations)

if __name__ == '__main__':
    app.run(debug=True)
