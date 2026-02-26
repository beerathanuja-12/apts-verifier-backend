# AI Document Verification System (Python Solution)

This is a complete Python-based solution for document verification using OCR. It uses **EasyOCR** for text extraction and **FastAPI** for the backend.

## 🚀 Features
- **Image Preprocessing**: Grayscale, noise removal, and thresholding using OpenCV.
- **AI OCR**: Pre-trained deep learning model (EasyOCR) for high accuracy on CPU.
- **REST API**: FastAPI endpoint for easy integration with mobile or web apps.
- **Confidence Scoring**: Returns a reliability score for each extraction.

## 🛠️ Setup Instructions

### 1. Install Dependencies
Ensure you have Python 3.8+ installed. Run:
```bash
pip install -r requirements.txt
```

### 2. Prepare the Dataset (Optional)
If you want to evaluate the model on your Kaggle dataset:
1. Place your images in a folder (e.g., `dataset/`).
2. For each image `img1.jpg`, create a text file `img1.txt` containing the correct text.
3. Run the evaluation script:
```bash
python train_eval.py
```

### 3. Start the API Server
Run the FastAPI server using Uvicorn:
```bash
python main.py
```
The server will start at `http://localhost:8000`.

## 🧪 Testing the API

### Using cURL
You can test the `/verify` endpoint by uploading an image:
```bash
curl -X 'POST' \
  'http://localhost:8000/verify' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@your_document.jpg;type=image/jpeg'
```

### Using Python (Requests)
```python
import requests

url = "http://localhost:8000/verify"
files = {'file': open('your_document.jpg', 'rb')}
response = requests.post(url, files=files)
print(response.json())
```

### Using Interactive Docs
FastAPI automatically generates documentation. Open your browser and go to:
`http://localhost:8000/docs`

## 📁 Project Structure
- `preprocess.py`: Image cleaning logic using OpenCV.
- `train_eval.py`: Script to evaluate OCR accuracy on a dataset.
- `main.py`: The FastAPI server implementation.
- `requirements.txt`: List of necessary Python libraries.
