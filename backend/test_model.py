import os
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "model", "liver_model.pkl")
scaler_path = os.path.join(BASE_DIR, "model", "scaler.pkl")


def test_saved_model():
    print("Loading model and scaler...")
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    # Feature order:
    # age, gender, total_bilirubin, direct_bilirubin, albumin, alkaline_phosphatase, sgot, cholesterol
    low_risk_sample = np.array([[52, 0, 1.1, 0.4, 3.8, 90, 42, 170]], dtype=float)
    high_risk_sample = np.array([[45, 1, 3.8, 1.9, 2.7, 240, 120, 230]], dtype=float)

    for label, sample in [("Low Risk Patient", low_risk_sample), ("High Risk Patient", high_risk_sample)]:
        scaled = scaler.transform(sample)
        prob = float(model.predict_proba(scaled)[0][1]) * 100.0
        result = "High Risk" if prob >= 50.0 else "Low Risk"
        print(f"{label} -> Result: {result} | Probability: {prob:.1f}%")

    print("PASS: Model and scaler loaded and executed cleanly!")


if __name__ == "__main__":
    test_saved_model()

