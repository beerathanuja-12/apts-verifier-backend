from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import os
import re
from preprocess import preprocess_image

app = FastAPI(title="AI Document Verification API")

# Enable CORS (Frontend connection kosam)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR Reader
reader = easyocr.Reader(['en'], gpu=False)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to the AI Document Verification API. Use /verify to upload an image."
    }


@app.post("/verify")
async def verify_document(file: UploadFile = File(...)):
    try:
        # 1️⃣ Save uploaded file
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # 2️⃣ Preprocess image
        processed_img = preprocess_image(temp_path)

        # 3️⃣ Run OCR
        results = reader.readtext(processed_img)

        extracted_texts = []
        total_confidence = 0.0

        for (bbox, text, prob) in results:
            extracted_texts.append(text.strip())
            total_confidence += float(prob)

        avg_confidence = (
            total_confidence / len(results)
            if results else 0.0
        )

        avg_percentage = round(avg_confidence * 100, 2)

        full_text = " ".join(extracted_texts)

        # -------- FIELD EXTRACTION --------

        name_match = re.search(r'\b[A-Z]{3,}(?:\s[A-Z]{3,})+\b', full_text)
        name = name_match.group(0) if name_match else "Not Detected"

        id_match = re.search(r'\b\d{2}[A-Z]{2,}\d+\b', full_text)
        student_id = id_match.group(0) if id_match else "Not Detected"

        phone_match = re.search(r'\b\d{10}\b', full_text)
        phone = phone_match.group(0) if phone_match else "Not Detected"

        # -------- AI AUTHENTICITY SCORING --------

        structure_score = 0

        if student_id != "Not Detected":
            structure_score += 40

        if phone != "Not Detected":
            structure_score += 30

        if name != "Not Detected":
            structure_score += 30

        authenticity_index = (0.6 * avg_percentage) + (0.4 * structure_score)
        authenticity_index = round(authenticity_index, 2)

        if authenticity_index >= 70:
            verdict = "Highly Likely Genuine"
        elif authenticity_index >= 50:
            verdict = "Moderately Reliable"
        else:
            verdict = "Suspicious / Possibly Fake"

        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return {
            "filename": file.filename,
            "status": "success",
            "detected_fields": {
                "Name": name,
                "Student ID": student_id,
                "Phone": phone
            },
            "ocr_confidence_percentage": avg_percentage,
            "authenticity_index": authenticity_index,
            "document_verdict": verdict
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)