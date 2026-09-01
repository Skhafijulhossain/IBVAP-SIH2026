import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Database path (SQLite by default in the backend directory)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "ibvap.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create SQLite engine with check_same_thread=False for FastAPI concurrency
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
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
