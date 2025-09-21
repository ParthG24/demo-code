# First, ensure you have the required libraries installed:
# pip install transformers torch pillow requests

from transformers import pipeline
from PIL import Image
import requests
from io import BytesIO
import os

def is_water_disaster(image_path_or_url):
    """
    Classifies an image and determines if it represents a water-related disaster.

    This function uses the 'Luwayy/disaster_images_model' from Hugging Face,
    which is trained to classify images into different types of disasters.

    Args:
        image_path_or_url (str): The local filepath or a public URL to an image.

    Returns:
        bool: True if the image is classified as 'Flood', 'Tsunami', or 'Water_Disaster', False otherwise.
        str: The predicted label from the model.
        float: The confidence score of the prediction.
    """
    try:
        # 1. Initialize the image classification pipeline with the specified model
        classifier = pipeline("image-classification", model="Luwayy/disaster_images_model")

        # 2. Load the image
        if image_path_or_url.startswith('http://') or image_path_or_url.startswith('https://'):
            response = requests.get(image_path_or_url)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content))
        else:
            image = Image.open(image_path_or_url)

        # 3. Classify the image
        predictions = classifier(image)

        # 4. Process the top prediction
        if predictions:
            top_prediction = predictions[0]
            label = top_prediction['label']
            score = top_prediction['score']

            print(f"Model classified the image as: '{label}' with confidence: {score:.4f}")

            # 5. Check if the label corresponds to a water disaster (CORRECTED LIST)
            water_disaster_labels = ['Flood', 'Tsunami', 'Water_Disaster']

            if label in water_disaster_labels:
                return True, label, score
            else:
                return False, label, score
        else:
            return False, "No prediction could be made.", 0.0

    except requests.exceptions.RequestException as e:
        print(f"Error fetching image from URL: {e}")
        return False, "URL fetch error", 0.0
    except FileNotFoundError:
        print(f"Error: The file was not found at '{image_path_or_url}'")
        return False, "File not found", 0.0
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False, "Error", 0.0

# --- Example Usage ---
if __name__ == "__main__":
    try:
        # Example with a placeholder - replace with a valid path for local testing
        local_image_path = "placeholder.jpg"
        # Create a dummy file for testing if it doesn't exist
        if not os.path.exists(local_image_path):
            with open(local_image_path, "w") as f:
                 f.write("This is a placeholder.")
            img = Image.new('RGB', (60, 30), color = 'red')
            img.save(local_image_path)

        is_water, disaster_type, confidence = is_water_disaster(local_image_path)
        print(f"Is the image a water disaster? {is_water}\n")
        os.remove(local_image_path)
    except Exception as e:
        print(f"Could not process local file example. Please update the path or check model download. Error: {e}")

