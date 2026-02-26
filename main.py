from fastapi import FastAPI, UploadFile, File
import easyocr
import cv2
import numpy as np
import os
from preprocess import preprocess_image

app = FastAPI(title="AI Document Verification API")

# Initialize EasyOCR Reader globally to avoid reloading on every request
# gpu=False for CPU compatibility
reader = easyocr.Reader(['en'], gpu=False)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Document Verification API. Use /verify to upload an image."}

@app.post("/verify")
async def verify_document(file: UploadFile = File(...)):
    """
    Endpoint to upload an image and get OCR results.
    """
    try:
        # 1. Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # 2. Preprocess the image
        processed_img = preprocess_image(temp_path)

        # 3. Run OCR
        # readtext returns a list of tuples: (bbox, text, confidence)
        results = reader.readtext(processed_img)

        # 4. Extract data and compute average confidence
        extracted_data = []
        total_confidence = 0
        
        for (bbox, text, prob) in results:
            extracted_data.append({
                "text": text,
                "confidence": float(prob)
            })
            total_confidence += prob

        avg_confidence = total_confidence / len(results) if results else 0

        # 5. Cleanup
        os.remove(temp_path)

        return {
            "filename": file.filename,
            "status": "success",
            "extracted_text": " ".join([item["text"] for item in extracted_data]),
            "details": extracted_data,
            "average_confidence": round(avg_confidence, 4),
            "is_reliable": avg_confidence > 0.5
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000)
