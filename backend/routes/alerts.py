import json
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.db_models import AlertModel
from ..models.schemas import Alert, AlertCreate, AlertActionRequest

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[Alert])
def get_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity: critical, warning, info, all"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: new, acknowledged, escalated_to_qrf, resolved, dismissed"),
    db: Session = Depends(get_db)
):
    """
    GET /api/alerts & GET /api/v1/alerts
    Returns the real-time correlated multi-sensor threat alert queue.
    """
    query = db.query(AlertModel)

    if severity and severity != "all":
        query = query.filter(AlertModel.severity == severity)
    if status_filter and status_filter != "all":
        query = query.filter(AlertModel.status == status_filter)

    alerts = query.all()
    return [a.to_dict() for a in alerts]


@router.get("/{alert_id}", response_model=Alert)
def get_alert_by_id(alert_id: str, db: Session = Depends(get_db)):
    """
    GET /api/alerts/{id}
    Retrieves full details and dossier metadata for an individual alert.
    """
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found."
        )
    return alert.to_dict()


@router.post("", response_model=Alert, status_code=status.HTTP_201_CREATED)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    """
    POST /api/alerts
    Injects or registers a new threat detection alert into the queue.
    """
    new_id = f"ALT-{random.randint(1000, 9999)}"

    db_alert = AlertModel(
        id=new_id,
        timestamp="Just now",
        camera_id=payload.cameraId,
        camera_name=payload.cameraName,
        sector=payload.sector,
        event_type=payload.eventType,
        severity=payload.severity,
        confidence=payload.confidence,
        status="new",
        thumbnail_url=payload.thumbnailUrl or "/snapshots/default-alert.jpg",
        description=payload.description,
        coordinates_json=json.dumps(payload.coordinates.model_dump()),
        qrf_dispatched=payload.qrfDispatched or False,
        assigned_unit=payload.assignedUnit,
        operator_notes=payload.operatorNotes,
        acknowledged_by=None,
    )

    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert.to_dict()


@router.post("/{alert_id}/acknowledge", response_model=Alert)
def acknowledge_alert(alert_id: str, payload: AlertActionRequest, db: Session = Depends(get_db)):
    """
    POST /api/alerts/{id}/acknowledge
    Marks alert as acknowledged by a command station operator.
    """
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found."
        )

    alert.status = "acknowledged"
    alert.acknowledged_by = payload.operatorName or "Station Operator"
    db.commit()
    db.refresh(alert)
    return alert.to_dict()


@router.post("/{alert_id}/escalate", response_model=Alert)
def escalate_alert_to_qrf(alert_id: str, payload: AlertActionRequest, db: Session = Depends(get_db)):
    """
    POST /api/alerts/{id}/escalate
    Dispatches Quick Reaction Force (QRF) team to alert coordinates.
    """
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found."
        )

    alert.status = "escalated_to_qrf"
    alert.qrf_dispatched = True
    alert.assigned_unit = payload.assignedUnit or "QRF Tactical Fast Unit 1"
    if payload.notes:
        alert.operator_notes = payload.notes

    db.commit()
    db.refresh(alert)
    return alert.to_dict()


@router.post("/{alert_id}/dismiss", response_model=Alert)
def dismiss_alert(alert_id: str, payload: AlertActionRequest, db: Session = Depends(get_db)):
    """
    POST /api/alerts/{id}/dismiss
    Dismisses alert as false positive or non-threat.
    """
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found."
        )

    alert.status = "dismissed"
    alert.operator_notes = payload.reason or "Marked as false alarm"
    db.commit()
    db.refresh(alert)
    return alert.to_dict()


@router.post("/{alert_id}/resolve", response_model=Alert)
def resolve_alert(alert_id: str, payload: AlertActionRequest, db: Session = Depends(get_db)):
    """
    POST /api/alerts/{id}/resolve
    Resolves the incident after sector confirmation.
    """
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found."
        )

    alert.status = "resolved"
    alert.operator_notes = payload.notes or "Incident resolved and secured."
    db.commit()
    db.refresh(alert)
    return alert.to_dict()
