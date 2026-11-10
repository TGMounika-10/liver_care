import os
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("livercare.db")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load .env from the backend directory (ensures correct path regardless of cwd)
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/livercare_db")
AUTO_SQLITE_FALLBACK = os.getenv("AUTO_SQLITE_FALLBACK", "true").lower() == "true"

Base = declarative_base()


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(16), nullable=False)
    total_bilirubin = Column(Float, nullable=False)
    direct_bilirubin = Column(Float, nullable=False)
    albumin = Column(Float, nullable=False)
    alkaline_phosphatase = Column(Float, nullable=False)
    sgot = Column(Float, nullable=False)
    cholesterol = Column(Float, nullable=False)
    result = Column(String(32), nullable=False)
    probability = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


def _create_engine_with_fallback():
    global DATABASE_URL
    active_backend = "PostgreSQL"

    # Normalize postgres:// to postgresql:// for SQLAlchemy 2.0+
    db_url = DATABASE_URL.replace("postgres://", "postgresql://", 1) if DATABASE_URL.startswith("postgres://") else DATABASE_URL

    try:
        eng = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 1} if "postgresql" in db_url else {})
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to PostgreSQL database successfully.")
        return eng, active_backend
    except Exception as exc:
        if AUTO_SQLITE_FALLBACK and "postgresql" in db_url:
            sqlite_path = os.path.join(BASE_DIR, "livercare_dev.db")
            sqlite_url = f"sqlite:///{sqlite_path}"
            logger.warning(
                "PostgreSQL unreachable (%s). Falling back to local SQLite dev database at %s. "
                "Update DATABASE_URL in .env once PostgreSQL is running.",
                str(exc).splitlines()[0],
                sqlite_path,
            )
            eng = create_engine(sqlite_url, connect_args={"check_same_thread": False})
            return eng, "SQLite (Dev Fallback)"
        raise


engine, ACTIVE_DB_BACKEND = _create_engine_with_fallback()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create tables and seed initial sample predictions if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(PredictionRecord).count()
        if count == 0:
            samples = [
                PredictionRecord(
                    age=52,
                    gender="Female",
                    total_bilirubin=1.1,
                    direct_bilirubin=0.4,
                    albumin=3.8,
                    alkaline_phosphatase=90.0,
                    sgot=42.0,
                    cholesterol=170.0,
                    result="Low Risk",
                    probability=18.7,
                    created_at=datetime(2026, 11, 3, 14, 15, tzinfo=timezone.utc),
                ),
                PredictionRecord(
                    age=45,
                    gender="Male",
                    total_bilirubin=3.8,
                    direct_bilirubin=1.9,
                    albumin=2.7,
                    alkaline_phosphatase=240.0,
                    sgot=120.0,
                    cholesterol=230.0,
                    result="High Risk",
                    probability=78.2,
                    created_at=datetime(2026, 10, 28, 11, 40, tzinfo=timezone.utc),
                ),
                PredictionRecord(
                    age=60,
                    gender="Female",
                    total_bilirubin=0.9,
                    direct_bilirubin=0.3,
                    albumin=4.1,
                    alkaline_phosphatase=85.0,
                    sgot=32.0,
                    cholesterol=160.0,
                    result="Low Risk",
                    probability=22.1,
                    created_at=datetime(2026, 10, 20, 21, 20, tzinfo=timezone.utc),
                ),
            ]
            db.add_all(samples)
            db.commit()
            logger.info("Seeded initial clinical records into predictions table (%s).", ACTIVE_DB_BACKEND)
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
