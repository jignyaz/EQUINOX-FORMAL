from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from database import get_db
from models import SupportTicket, Notification
from auth import get_current_customer, get_current_operator
import datetime

router = APIRouter(prefix="/api/support", tags=["Support"])


class TicketCreate(BaseModel):
    subject: str
    description: str
    category: str = "general"
    order_id: Optional[int] = None


class TicketResolve(BaseModel):
    admin_response: str
    status: str = "Resolved"


@router.post("/tickets")
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    ticket = SupportTicket(
        customer_id=customer.id,
        order_id=payload.order_id,
        subject=payload.subject,
        description=payload.description,
        category=payload.category,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {"success": True, "ticket_id": ticket.id}


@router.get("/tickets/me")
def my_tickets(db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    return db.query(SupportTicket).filter(SupportTicket.customer_id == customer.id).order_by(SupportTicket.created_at.desc()).all()


@router.get("/tickets")
def all_tickets(status: Optional[str] = None, db: Session = Depends(get_db), op = Depends(get_current_operator)):
    q = db.query(SupportTicket)
    if status:
        q = q.filter(SupportTicket.status == status)
    return q.order_by(SupportTicket.created_at.desc()).all()


@router.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, payload: TicketResolve, db: Session = Depends(get_db), op = Depends(get_current_operator)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(404, "Ticket not found")
    ticket.admin_response = payload.admin_response
    ticket.status = payload.status
    ticket.resolved_at = datetime.datetime.utcnow()
    # Notify customer
    db.add(Notification(
        customer_id=ticket.customer_id,
        title=f"Support Ticket #{ticket.id} {payload.status}",
        body=payload.admin_response,
        type="info"
    ))
    db.commit()
    return {"success": True}
