import os
from contextlib import asynccontextmanager
from typing import List
import joblib
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize PostgreSQL / DB schema & seed initial rows if empty
    init_db()

    # Load ML model & scaler once at startup
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        ml_artifacts["model"] = joblib.load(MODEL_PATH)
        ml_artifacts["scaler"] = joblib.load(SCALER_PATH)
    else:
        raise RuntimeError(
            f"ML model artifacts missing at {MODEL_PATH} / {SCALER_PATH}. Run train_model.py first."
        )
    yield


app = FastAPI(
    title="LiverCare AI — Liver Cirrhosis Prediction API",
    description="FastAPI + scikit-learn RandomForest + PostgreSQL + ReportLab clinical PDF generator.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for React frontend (local dev + Vercel deployments)
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.(vercel\.app|supabase\.co)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "LiverCare AI API",
        "status": "running",
        "database": ACTIVE_DB_BACKEND,
        "model_loaded": ml_artifacts["model"] is not None,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database_backend": ACTIVE_DB_BACKEND,
        "model_ready": ml_artifacts["model"] is not None and ml_artifacts["scaler"] is not None,
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_liver_risk(payload: PatientInput, db: Session = Depends(get_db)):
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

