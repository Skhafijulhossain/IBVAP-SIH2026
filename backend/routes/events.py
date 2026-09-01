from datetime import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.db_models import EventModel
from ..models.schemas import SurveillanceEvent, SurveillanceEventCreate

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[SurveillanceEvent])
def get_events(
    search: Optional[str] = Query(None, description="Search keyword in description, cameraName, id, sector"),
    event_type: Optional[str] = Query(None, alias="eventType", description="Filter by event type"),
    camera_id: Optional[str] = Query(None, alias="cameraId", description="Filter by camera ID"),
    threat_level: Optional[str] = Query(None, alias="threatLevel", description="Filter by threat level"),
    min_confidence: Optional[float] = Query(None, alias="minConfidence", description="Minimum AI confidence threshold"),
    db: Session = Depends(get_db)
):
    """
    GET /api/events & GET /api/v1/events
    Queries the border surveillance event forensics archive.
    """
    query = db.query(EventModel)

    if event_type and event_type != "all":
        query = query.filter(EventModel.event_type == event_type)
    if camera_id and camera_id != "all":
        query = query.filter(EventModel.camera_id == camera_id)
    if threat_level and threat_level != "all":
        query = query.filter(EventModel.threat_level == threat_level)
    if min_confidence is not None:
        query = query.filter(EventModel.confidence >= min_confidence)

    events = query.all()
    results = [e.to_dict() for e in events]

    if search:
        q = search.lower()
        results = [
            e for e in results
            if q in e["description"].lower()
            or q in e["cameraName"].lower()
            or q in e["id"].lower()
            or q in e["sector"].lower()
        ]

    return results


@router.get("/{event_id}", response_model=SurveillanceEvent)
def get_event_by_id(event_id: str, db: Session = Depends(get_db)):
    """
    GET /api/events/{id}
    Retrieves a single forensic event record.
    """
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event {event_id} not found."
        )
    return event.to_dict()


@router.post("/log", response_model=SurveillanceEvent, status_code=status.HTTP_201_CREATED)
def log_event(payload: SurveillanceEventCreate, db: Session = Depends(get_db)):
    """
    POST /api/events/log
    Appends an AI-detected event to the persistent historical audit log.
    """
    new_id = f"EVT-{random.randint(5050, 9999)}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")

    db_event = EventModel(
        id=new_id,
        timestamp=now_str,
        camera_id=payload.cameraId,
        camera_name=payload.cameraName,
        sector=payload.sector,
        event_type=payload.eventType,
        confidence=payload.confidence,
        duration_sec=payload.durationSec,
        threat_level=payload.threatLevel,
        snapshot_url=payload.snapshotUrl or "/snapshots/default-event.jpg",
        description=payload.description,
        resolved_by=payload.resolvedBy or "Pending Triage",
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event.to_dict()
