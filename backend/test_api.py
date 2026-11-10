import os
import sys
import requests

BASE_URL = os.getenv("API_URL", "http://localhost:8000")


def run_live_api_tests():
    print(f"Testing LiverCare AI API at {BASE_URL} ...")
    session = requests.Session()
    session.trust_env = False

    # 1. Health check
    try:
        r_health = session.get(f"{BASE_URL}/health", timeout=5)
        assert r_health.status_code == 200
        print(f"PASS [GET /health]: {r_health.json()}")
    except Exception as e:
        print(f"FAIL [GET /health]: {e}")
        return False

    # 2. POST /predict
    sample_patient = {
        "age": 52,
        "gender": 0,
        "total_bilirubin": 1.1,
        "direct_bilirubin": 0.4,
        "albumin": 3.8,
        "alkaline_phosphatase": 90,
        "sgot": 42,
        "cholesterol": 170,
    }
    r_pred = session.post(f"{BASE_URL}/predict", json=sample_patient, timeout=5)
    assert r_pred.status_code == 200, f"Status {r_pred.status_code}: {r_pred.text}"
    pred_data = r_pred.json()
    print(f"PASS [POST /predict]: Result={pred_data['result']}, Probability={pred_data['probability']}%, ID={pred_data['id']}")

    # 3. GET /history
    r_hist = session.get(f"{BASE_URL}/history", timeout=5)
    assert r_hist.status_code == 200
    hist_data = r_hist.json()
    assert len(hist_data) > 0
    print(f"PASS [GET /history]: Returned {len(hist_data)} records")

    # 4. GET /report/{id}
    record_id = pred_data["id"]
    r_pdf = session.get(f"{BASE_URL}/report/{record_id}", timeout=5)
    assert r_pdf.status_code == 200
    assert r_pdf.headers.get("content-type", "").startswith("application/pdf")
    out_pdf = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"test_report_{record_id}.pdf")
    with open(out_pdf, "wb") as f:
        f.write(r_pdf.content)
    print(f"PASS [GET /report/{record_id}]: Saved PDF ({len(r_pdf.content)} bytes) to {out_pdf}")
    return True


if __name__ == "__main__":
    ok = run_live_api_tests()
    sys.exit(0 if ok else 1)
