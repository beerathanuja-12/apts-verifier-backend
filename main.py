from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import os
import re
from preprocess import preprocess_image

app = FastAPI(title="Universal AI Document Verification API")

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
        "message": "Welcome to Universal AI Document Verification API. Use /verify to upload a document."
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
            clean_text = text.strip()
            if clean_text:
                extracted_texts.append(clean_text)
                total_confidence += float(prob)

        avg_confidence = (
            total_confidence / len(results)
            if results else 0.0
        )

        avg_percentage = round(avg_confidence * 100, 2)

        full_text = " ".join(extracted_texts)

        # -------- UNIVERSAL FIELD EXTRACTION --------

        # Aadhaar (12 digits)
        aadhaar_match = re.search(r'\b\d{4}\s?\d{4}\s?\d{4}\b', full_text)
        aadhaar = aadhaar_match.group(0) if aadhaar_match else "Not Detected"

        # PAN Card
        pan_match = re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', full_text)
        pan = pan_match.group(0) if pan_match else "Not Detected"

        # Phone number
        phone_match = re.search(r'\b\d{10}\b', full_text)
        phone = phone_match.group(0) if phone_match else "Not Detected"

        # Email
        email_match = re.search(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', full_text)
        email = email_match.group(0) if email_match else "Not Detected"

        # Name detection
        name_match = re.search(r'\b[A-Z]{3,}(?:\s[A-Z]{3,})+\b', full_text)
        name = name_match.group(0) if name_match else "Not Detected"

        # -------- SMART AUTHENTICITY SCORING --------

        structure_score = 0

        if aadhaar != "Not Detected":
            structure_score += 30

        if pan != "Not Detected":
            structure_score += 30

        if phone != "Not Detected":
            structure_score += 15

        if email != "Not Detected":
            structure_score += 10

        if name != "Not Detected":
            structure_score += 15

        structure_score = min(structure_score, 100)

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
                "Aadhaar": aadhaar,
                "PAN": pan,
                "Phone": phone,
                "Email": email
            },
            "ocr_confidence_percentage": avg_percentage,
            "structure_score": structure_score,
            "authenticity_index": authenticity_index,
            "document_verdict": verdict
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
