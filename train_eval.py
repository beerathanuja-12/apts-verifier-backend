import easyocr
import os
import json
from preprocess import preprocess_image

def evaluate_ocr(dataset_path):
    """
    Evaluates EasyOCR on a folder of images.
    Expects a folder structure where each image has a corresponding .txt file with ground truth.
    """
    # Initialize EasyOCR Reader (English)
    # gpu=False ensures it runs on CPU
    reader = easyocr.Reader(['en'], gpu=False)
    
    results = []
    
    # Iterate through images in the dataset
    for filename in os.listdir(dataset_path):
        if filename.endswith((".jpg", ".png", ".jpeg")):
            img_path = os.path.join(dataset_path, filename)
            gt_path = os.path.splitext(img_path)[0] + ".txt"
            
            if not os.path.exists(gt_path):
                continue
                
            # Read ground truth
            with open(gt_path, 'r') as f:
                ground_truth = f.read().strip()
            
            # Preprocess and Run OCR
            processed_img = preprocess_image(img_path)
            ocr_result = reader.readtext(processed_img, detail=0)
            extracted_text = " ".join(ocr_result)
            
            # Simple evaluation (Exact match or word overlap)
            is_correct = ground_truth.lower() in extracted_text.lower()
            
            results.append({
                "filename": filename,
                "ground_truth": ground_truth,
                "extracted_text": extracted_text,
                "is_correct": is_correct
            })
            
            print(f"Processed {filename}: {'Match' if is_correct else 'No Match'}")

    # Calculate Accuracy
    if results:
        accuracy = sum(1 for r in results if r['is_correct']) / len(results)
        print(f"\nFinal Accuracy: {accuracy * 100:.2f}%")
        
        # Save evaluation report
        with open("evaluation_report.json", "w") as f:
            json.dump(results, f, indent=4)
            
    return reader

if __name__ == "__main__":
    # Create a dummy dataset folder for demonstration
    os.makedirs("sample_dataset", exist_ok=True)
    print("Created 'sample_dataset' folder. Add images and .txt files there to run evaluation.")
    
    # In a real scenario, you would point this to your Kaggle dataset path
    # reader = evaluate_ocr("sample_dataset")
