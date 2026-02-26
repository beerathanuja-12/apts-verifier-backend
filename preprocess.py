import cv2
import numpy as np

def preprocess_image(image_path):
    """
    Advanced preprocessing for improved OCR accuracy.
    """

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Image not found or invalid format")

    # 1️⃣ Resize (increase clarity for small text)
    img = cv2.resize(img, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)

    # 2️⃣ Convert to Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3️⃣ Contrast Enhancement (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)

    # 4️⃣ Noise Removal
    blurred = cv2.GaussianBlur(enhanced, (5,5), 0)

    # 5️⃣ Adaptive Threshold (better than Otsu for ID cards)
    thresh = cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )

    return thresh