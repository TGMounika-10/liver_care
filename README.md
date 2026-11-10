# LiverCare AI — Liver Cirrhosis Prediction System

LiverCare AI is a full-stack clinical decision-support application for evaluating liver cirrhosis risk from routine blood test biomarkers.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios
- **Backend:** Python 3.11, FastAPI, Uvicorn, scikit-learn (Random Forest), pandas, numpy, ReportLab
- **Database:** PostgreSQL (`predictions` table via SQLAlchemy + `psycopg2-binary`)

---

## Project Structure
```text
LiverCare/
├── frontend/                     # React Vite Frontend
│   ├── src/
│   │   ├── components/           # Layout, Sidebar, 3D Medical Illustrations
│   │   ├── pages/                # Dashboard, PatientDetails, Prediction, Reports
│   │   ├── services/api.js       # FastAPI Axios Bridge
│   │   └── App.jsx
│   └── package.json
├── backend/                      # Python ML & FastAPI Backend
│   ├── data/
│   │   ├── indian_liver_patient.csv
│   │   └── charts/               # EDA, Correlation, Confusion Matrix, ROC PNGs
│   ├── model/
│   │   ├── liver_model.pkl       # Trained RandomForestClassifier
│   │   └── scaler.pkl            # Fitted StandardScaler
│   ├── main.py                   # FastAPI REST Endpoints (/predict, /history, /report/{id})
│   ├── database.py               # PostgreSQL SQLAlchemy ORM (with local dev fallback)
│   ├── schemas.py                # Pydantic Request/Response Validation
│   ├── pdf_generator.py          # ReportLab Clinical PDF Generator
│   ├── train_model.py            # Dataset Loading, EDA Charts, Model Comparison & Export
│   ├── test_model.py             # Standalone Model Inference Verification
│   ├── test_api.py               # Live API Integration Verification
│   ├── init_postgres.sql         # PostgreSQL Schema DDL
│   ├── .env.example              # Environment Template
│   └── requirements.txt
├── .gitignore
└── README.md
```

---

## 1. PostgreSQL Database Setup

Create the `livercare_db` database in PostgreSQL (`pgAdmin` or `psql`):
```sql
CREATE DATABASE livercare_db;
```
Then run `backend/init_postgres.sql` or simply start the FastAPI server — SQLAlchemy will automatically create the `predictions` table on startup.

Configure your PostgreSQL connection string in `backend/.env`:
```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/livercare_db
```
*(Note: While `AUTO_SQLITE_FALLBACK=true` is enabled in `.env`, the backend will safely fall back to a local SQLite dev database if PostgreSQL is not yet installed or running on your machine so you can test the app immediately.)*

---

## 2. Running the Backend (FastAPI + ML)

```powershell
cd LiverCare\backend
.\.venv\Scripts\uvicorn main:app --reload --port 8000
```
- **API Base URL:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

---

## 3. Running the Frontend (React + Vite)

```powershell
cd LiverCare\frontend
npm run dev
```
- **Web App URL:** `http://localhost:5173`
