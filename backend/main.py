import io
import os
from contextlib import asynccontextmanager
from typing import List
import joblib
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse, JSONResponse
from sqlalchemy.orm import Session

from database import init_db, get_db, PredictionRecord, ACTIVE_DB_BACKEND
from schemas import PatientInput, PredictionResponse, HistoryRecord
from pdf_generator import generate_clinical_pdf

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "liver_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "model", "scaler.pkl")
CHARTS_DIR = os.path.join(BASE_DIR, "data", "charts")

ml_artifacts = {"model": None, "scaler": None}


def ensure_ml_artifacts():
    """Load ML model & scaler if not already loaded (supports serverless warm/cold start)."""
    if ml_artifacts["model"] is None or ml_artifacts["scaler"] is None:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            try:
                ml_artifacts["model"] = joblib.load(MODEL_PATH)
                ml_artifacts["scaler"] = joblib.load(SCALER_PATH)
            except Exception as e:
                print(f"Error loading ML artifacts: {e}")
    return ml_artifacts


# Preload on import for serverless
ensure_ml_artifacts()
try:
    init_db()
except Exception as e:
    print(f"DB init warning on startup: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize PostgreSQL / DB schema & seed initial rows if empty
    try:
        init_db()
    except Exception as e:
        print(f"DB init warning in lifespan: {e}")

    ensure_ml_artifacts()
    yield


app = FastAPI(
    title="LiverCare AI — Liver Cirrhosis Prediction API",
    description="FastAPI + scikit-learn RandomForest + PostgreSQL + ReportLab clinical PDF generator.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for React frontend (local dev + Vercel deployments)
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://liver-care-ten.vercel.app")
allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
if "https://liver-care-ten.vercel.app" not in allowed_origins:
    allowed_origins.append("https://liver-care-ten.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("VERCEL") else allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/favicon.svg", include_in_schema=False)
def backend_favicon():
    from fastapi.responses import Response
    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#0D7377"/>
      <path d="M16 33C14 25 20 19 31 19C41 19 49 23 50 29C51 34 46 39 39 40C35 41 32 45 26 45C20 45 17 39 16 33Z" fill="#FFFFFF"/>
      <path d="M18 32H25L28 25L33 38L36 30H46" stroke="#0D7377" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="48" cy="48" r="10" fill="#FFFFFF"/>
      <path d="M48 43.5V52.5M43.5 48H52.5" stroke="#0D7377" stroke-width="2.6" stroke-linecap="round"/>
    </svg>"""
    return Response(content=svg, media_type="image/svg+xml")


@app.get("/", tags=["Health"])
def root(request: Request):
    ensure_ml_artifacts()
    accept = request.headers.get("accept", "")
    if "text/html" in accept and "application/json" not in accept:
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            <title>LiverCare AI — Backend & ML Engine</title>
            <style>
                body {{ font-family: system-ui, -apple-system, sans-serif; background: #EEF6F6; color: #1E293B; margin: 0; padding: 32px 16px; }}
                .card {{ max-width: 780px; margin: 0 auto; background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(13,115,119,0.08); border: 1px solid #E2E8F0; }}
                .badge {{ display: inline-block; background: #EBF7F7; color: #0D7377; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 999px; margin-bottom: 12px; }}
                h1 {{ margin: 0 0 8px; color: #0E2738; font-size: 28px; }}
                p {{ color: #475569; line-height: 1.6; }}
                .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin: 22px 0; }}
                .box {{ background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 14px; }}
                .box small {{ color: #64748B; font-weight: 700; text-transform: uppercase; font-size: 10px; }}
                .box div {{ font-weight: 700; color: #0D7377; margin-top: 4px; font-size: 15px; }}
                .links a {{ display: inline-block; margin: 6px 8px 0 0; padding: 10px 16px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; }}
                .primary {{ background: #0D7377; color: #fff; }}
                .secondary {{ background: #F1F5F9; color: #1E293B; }}
            </style>
        </head>
        <body>
            <div class="card">
                <span class="badge">LiverCare AI v1.0 · Clinical ML Engine</span>
                <h1>Liver Cirrhosis Prediction API</h1>
                <p>FastAPI + Calibrated Random Forest ML Engine connected to Supabase Cloud PostgreSQL with ReportLab clinical PDF reporting.</p>
                <div class="grid">
                    <div class="box"><small>Service Status</small><div>● Running</div></div>
                    <div class="box"><small>Database</small><div>{ACTIVE_DB_BACKEND}</div></div>
                    <div class="box"><small>ML Model</small><div>Calibrated Random Forest</div></div>
                    <div class="box"><small>Model Loaded</small><div>{"Yes (Ready)" if ml_artifacts["model"] is not None else "No"}</div></div>
                </div>
                <div class="links">
                    <a class="primary" href="https://liver-care-ten.vercel.app/" target="_blank">Open Web Application ↗</a>
                    <a class="secondary" href="/model-info">ML Model Info (JSON)</a>
                    <a class="secondary" href="/docs">Swagger API Docs</a>
                    <a class="secondary" href="/health">Health Check</a>
                </div>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html)
    return {
        "service": "LiverCare AI API",
        "status": "running",
        "database": ACTIVE_DB_BACKEND,
        "model_loaded": ml_artifacts["model"] is not None,
        "ml_algorithm": "Calibrated Random Forest (250 trees + Sigmoid Calibration)",
        "docs": "/docs",
        "model_info": "/model-info",
    }


@app.get("/health", tags=["Health"])
def health_check():
    ensure_ml_artifacts()
    return {
        "status": "healthy",
        "database_backend": ACTIVE_DB_BACKEND,
        "model_ready": ml_artifacts["model"] is not None and ml_artifacts["scaler"] is not None,
    }


@app.get("/model-info", tags=["Analytics"])
def get_model_info():
    """Return full ML architecture, feature importance, model comparison metrics, and chart URLs."""
    ensure_ml_artifacts()
    feature_labels = [
        ("age", "Patient Age"),
        ("gender", "Biological Sex"),
        ("total_bilirubin", "Total Bilirubin"),
        ("direct_bilirubin", "Direct Bilirubin"),
        ("albumin", "Serum Albumin"),
        ("alkaline_phosphatase", "Alkaline Phosphatase (ALP)"),
        ("sgot", "SGOT (AST)"),
        ("cholesterol", "Total Cholesterol"),
    ]
    importances = []
    model = ml_artifacts.get("model")
    if model is not None:
        est = getattr(model, "estimator", None)
        if hasattr(model, "calibrated_classifiers_") and len(model.calibrated_classifiers_) > 0:
            est = model.calibrated_classifiers_[0].estimator
        if est is not None and hasattr(est, "feature_importances_"):
            for (key, label), imp in zip(feature_labels, est.feature_importances_):
                importances.append({
                    "key": key,
                    "feature": label,
                    "importance": round(float(imp) * 100.0, 2),
                })
            importances.sort(key=lambda x: x["importance"], reverse=True)

    return {
        "project": {
            "name": "LiverCare AI — Liver Cirrhosis Prediction System",
            "version": "1.0.0",
            "purpose": "Clinical decision-support platform for evaluating liver cirrhosis risk from routine Blood Liver Function Test (LFT) biomarkers.",
            "stack": {
                "frontend": "React 18, Vite, Tailwind CSS, Recharts, Axios",
                "backend": "Python 3.11, FastAPI, Scikit-Learn, ReportLab PDF",
                "database": ACTIVE_DB_BACKEND,
                "hosting": "Vercel Serverless (Frontend + FastAPI Backend) + Supabase Cloud PostgreSQL",
            },
        },
        "ml_pipeline": {
            "primary_model": "Calibrated Random Forest (Sigmoid + 250 Estimators, max_depth=7)",
            "preprocessing": "StandardScaler (Z-score normalization)",
            "calibration": "CalibratedClassifierCV (method='sigmoid') to align risk probabilities with clinical reference ranges",
            "dataset": "UCI Indian Liver Patient Dataset (583 patients) + 220 Verified Normal Reference Controls (803 total records)",
            "feature_count": 8,
            "roc_auc": 0.918,
            "risk_thresholds": [
                {"range": "0% - 29.9%", "label": "Low Risk", "stage": "Stage 0: Normal / Minimal Risk"},
                {"range": "30% - 49.9%", "label": "Low Risk (Monitor)", "stage": "Stage 1: Mild Hepatic Stress"},
                {"range": "50% - 74.9%", "label": "High Risk", "stage": "Stage 2: Moderate Fibrosis / Steatohepatitis"},
                {"range": "75% - 100%", "label": "High Risk (Critical)", "stage": "Stage 3-4: Advanced Fibrosis / Cirrhosis"},
            ],
        },
        "model_comparison": [
            {"model": "Calibrated Random Forest (Production)", "accuracy": 76.88, "precision": 75.56, "recall": 81.93, "f1_score": 0.7861, "selected": True},
            {"model": "SVM (RBF Kernel)", "accuracy": 80.62, "precision": 77.08, "recall": 89.16, "f1_score": 0.8268, "selected": False},
            {"model": "Random Forest (Base)", "accuracy": 77.50, "precision": 74.23, "recall": 86.75, "f1_score": 0.8000, "selected": False},
            {"model": "Logistic Regression", "accuracy": 78.12, "precision": 79.27, "recall": 78.31, "f1_score": 0.7879, "selected": False},
            {"model": "Decision Tree", "accuracy": 76.25, "precision": 71.84, "recall": 89.16, "f1_score": 0.7957, "selected": False},
        ],
        "feature_importance": importances,
        "charts": [
            {"name": "ROC Curve", "file": "roc_curve.png", "desc": "Receiver Operating Characteristic curve showing discrimination power."},
            {"name": "Confusion Matrix", "file": "confusion_matrix.png", "desc": "True vs Predicted classification breakdown on the validation split."},
            {"name": "Feature Importance", "file": "feature_importance.png", "desc": "Relative biomarker influence inside the Random Forest trees."},
            {"name": "Correlation Heatmap", "file": "correlation_heatmap.png", "desc": "Pearson correlation matrix across the 8 biomarkers and target."},
            {"name": "Class Balance", "file": "class_balance.png", "desc": "Distribution of Liver Disease vs Healthy Control cohorts."},
            {"name": "Bilirubin Boxplots", "file": "bilirubin_boxplots.png", "desc": "Total & Direct Bilirubin spread across clinical diagnosis classes."},
        ],
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_liver_risk(payload: PatientInput, db: Session = Depends(get_db)):
    ensure_ml_artifacts()
    model = ml_artifacts["model"]
    scaler = ml_artifacts["scaler"]
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="ML model is not loaded")

    # Exact feature order matching train_model.py:
    # ['age', 'gender', 'total_bilirubin', 'direct_bilirubin', 'albumin', 'alkaline_phosphatase', 'sgot', 'cholesterol']
    features = np.array(
        [
            [
                payload.age,
                payload.gender,
                payload.total_bilirubin,
                payload.direct_bilirubin,
                payload.albumin,
                payload.alkaline_phosphatase,
                payload.sgot,
                payload.cholesterol,
            ]
        ],
        dtype=float,
    )

    scaled_features = scaler.transform(features)
    proba = float(model.predict_proba(scaled_features)[0][1]) * 100.0
    probability = round(proba, 1)
    result = "High Risk" if probability >= 50.0 else "Low Risk"
    gender_label = "Male" if payload.gender == 1 else "Female"

    # Clinical Cirrhosis Stage Stratification
    if probability < 30.0:
        stage = "Stage 0: Normal / Minimal Risk"
    elif probability < 50.0:
        stage = "Stage 1: Mild Hepatic Stress / Monitor"
    elif probability < 75.0:
        stage = "Stage 2: Moderate Fibrosis / Steatohepatitis"
    else:
        stage = "Stage 3-4: Advanced Fibrosis / Cirrhosis"

    record = PredictionRecord(
        age=payload.age,
        gender=gender_label,
        total_bilirubin=payload.total_bilirubin,
        direct_bilirubin=payload.direct_bilirubin,
        albumin=payload.albumin,
        alkaline_phosphatase=payload.alkaline_phosphatase,
        sgot=payload.sgot,
        cholesterol=payload.cholesterol,
        result=result,
        probability=probability,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return PredictionResponse(
        id=record.id,
        result=result,
        probability=probability,
        risk_level=result,
        stage=stage,
        database_backend=ACTIVE_DB_BACKEND,
    )


@app.get("/history", response_model=List[HistoryRecord], tags=["History"])
def get_prediction_history(db: Session = Depends(get_db)):
    rows = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc(), PredictionRecord.id.desc()).all()
    history_list = []
    for r in rows:
        created_iso = r.created_at.isoformat() if r.created_at else ""
        formatted = r.created_at.strftime("%d %b %Y, %I:%M %p") if r.created_at else ""
        history_list.append(
            HistoryRecord(
                id=r.id,
                age=r.age,
                gender=r.gender,
                total_bilirubin=r.total_bilirubin,
                direct_bilirubin=r.direct_bilirubin,
                albumin=r.albumin,
                alkaline_phosphatase=r.alkaline_phosphatase,
                sgot=r.sgot,
                cholesterol=r.cholesterol,
                result=r.result,
                probability=r.probability,
                created_at=created_iso,
                formatted_date=formatted,
            )
        )
    return history_list


@app.delete("/history/{record_id}", tags=["History"])
def delete_prediction_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Record #{record_id} not found")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Record #{record_id} deleted successfully", "id": record_id}


@app.get("/history/export/csv", tags=["History"])
def export_history_csv(db: Session = Depends(get_db)):
    import csv
    from fastapi.responses import Response

    rows = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc(), PredictionRecord.id.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID", "Date", "Age", "Gender", "Total Bilirubin (mg/dL)",
        "Direct Bilirubin (mg/dL)", "Serum Albumin (g/dL)", "Alkaline Phosphatase (U/L)",
        "SGOT/AST (U/L)", "Cholesterol (mg/dL)", "Prediction Result", "Risk Probability (%)"
    ])
    for r in rows:
        writer.writerow([
            r.id,
            r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
            r.age,
            r.gender,
            r.total_bilirubin,
            r.direct_bilirubin,
            r.albumin,
            r.alkaline_phosphatase,
            r.sgot,
            r.cholesterol,
            r.result,
            r.probability,
        ])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="livercare_patient_records.csv"'},
    )


@app.get("/report/{record_id}", tags=["Reports"])
def download_pdf_report(record_id: int, db: Session = Depends(get_db)):
    record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Prediction record #{record_id} not found")

    pdf_buffer = generate_clinical_pdf(record)
    headers = {
        "Content-Disposition": f'attachment; filename="livercare_report_{record_id}.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)


@app.get("/charts/{chart_name}", tags=["Analytics"])
def get_chart_image(chart_name: str):
    safe_name = os.path.basename(chart_name)
    file_path = os.path.join(CHARTS_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Chart not found")
    return FileResponse(file_path, media_type="image/png")

