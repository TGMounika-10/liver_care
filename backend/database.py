import os
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

logger = logging.getLogger("livercare.db")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load .env from the backend directory (ensures correct path regardless of cwd)
load_dotenv(os.path.join(BASE_DIR, ".env"))

# IPv4-compatible Supabase Pooler URL (required for Vercel / AWS Lambda IPv4 serverless)
DEFAULT_SUPABASE_POOLER_URL = (
    "postgresql://postgres.ezdijbujbydtlwfpwdyo:Mounika%401025"
    "@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
)

_env_db = os.getenv("DATABASE_URL", "").strip()
if not _env_db or (("localhost" in _env_db or "127.0.0.1" in _env_db) and os.getenv("VERCEL")):
    DATABASE_URL = DEFAULT_SUPABASE_POOLER_URL
elif "db.ezdijbujbydtlwfpwdyo.supabase.co" in _env_db:
    # Direct host is IPv6-only; convert automatically to IPv4 Supavisor pooler for Vercel compatibility
    DATABASE_URL = DEFAULT_SUPABASE_POOLER_URL
else:
    DATABASE_URL = _env_db

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
    active_backend = "PostgreSQL (Supabase)"

    # Normalize postgres:// to postgresql:// for SQLAlchemy 2.0+
    db_url = DATABASE_URL.replace("postgres://", "postgresql://", 1) if DATABASE_URL.startswith("postgres://") else DATABASE_URL

    is_serverless_fs = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
    use_null_pool = bool(is_serverless_fs or ":6543" in db_url)
    engine_kwargs = {
        "connect_args": {"connect_timeout": 10} if "postgresql" in db_url else {},
    }
    if use_null_pool:
        engine_kwargs["poolclass"] = NullPool
    else:
        engine_kwargs["pool_pre_ping"] = True

    try:
        eng = create_engine(db_url, **engine_kwargs)
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to PostgreSQL database successfully.")
        return eng, active_backend
    except Exception as exc:
        logger.warning("Primary DB URL failed (%s). Retrying Supabase IPv4 pooler...", str(exc).splitlines()[0])
        if db_url != DEFAULT_SUPABASE_POOLER_URL:
            try:
                eng = create_engine(
                    DEFAULT_SUPABASE_POOLER_URL,
                    poolclass=NullPool,
                    connect_args={"connect_timeout": 10},
                )
                with eng.connect() as conn:
                    conn.execute(text("SELECT 1"))
                logger.info("Connected to Supabase IPv4 Pooler successfully.")
                return eng, active_backend
            except Exception as pool_exc:
                logger.warning("Supabase pooler retry failed: %s", str(pool_exc).splitlines()[0])

        if AUTO_SQLITE_FALLBACK:
            # On Vercel / Lambda, only /tmp is writable
            sqlite_path = "/tmp/livercare_dev.db" if is_serverless_fs else os.path.join(BASE_DIR, "livercare_dev.db")
            sqlite_url = f"sqlite:///{sqlite_path}"
            logger.warning(
                "PostgreSQL unreachable. Falling back to SQLite dev database at %s.",
                sqlite_path,
            )
            eng = create_engine(sqlite_url, connect_args={"check_same_thread": False})
            return eng, "SQLite (Dev Fallback)"
        raise


engine, ACTIVE_DB_BACKEND = _create_engine_with_fallback()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create tables and seed initial sample predictions if empty."""
    try:
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
    except Exception as exc:
        logger.error("Database initialization notice: %s", exc)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
