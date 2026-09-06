import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Database path (SQLite by default in the backend directory, or /tmp in serverless environments)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "ibvap.db")
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        DATABASE_URL = "sqlite:////tmp/ibvap.db"
    else:
        DATABASE_URL = f"sqlite:///{DB_PATH}"

# Render PostgreSQL sets postgres:// - SQLAlchemy 2.0 requires postgresql://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with check_same_thread=False only for SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI Dependency for database session injection with auto-cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
