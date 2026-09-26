from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Notification
from auth import get_current_customer

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/")
def get_notifications(db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    return db.query(Notification).filter(Notification.customer_id == customer.id).order_by(Notification.created_at.desc()).limit(20).all()


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    count = db.query(Notification).filter(Notification.customer_id == customer.id, Notification.is_read == False).count()
    return {"count": count}


@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    db.query(Notification).filter(Notification.customer_id == customer.id).update({"is_read": True})
    db.commit()
    return {"success": True}
