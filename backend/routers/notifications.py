from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..db import database, models
from ..auth import utils

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)


@router.get("/")
def get_notifications(
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Return all notifications for the logged-in user, newest first."""
    rows = db.query(models.Notification).filter(
        models.Notification.receiver_email == current_user.email
    ).order_by(models.Notification.created_at.desc()).all()

    return [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "read": n.read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in rows
    ]


class MarkReadRequest(BaseModel):
    id: str


@router.post("/read")
def mark_notification_read(
    payload: MarkReadRequest,
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Mark a single notification as read."""
    notif = db.query(models.Notification).filter(
        models.Notification.id == payload.id,
        models.Notification.receiver_email == current_user.email
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.read = True
    db.commit()

    return {"success": True}
