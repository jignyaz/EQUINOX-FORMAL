from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Order, DeliveryEvent, OrderStatus, Operator
from schemas import DeliveryEventCreate, DeliveryEventOut
from auth import get_current_operator, get_current_customer
from fsm import get_next_state
from routers.admin import transition_order_state
from schemas import TransitionRequest

router = APIRouter(prefix="/api", tags=["Delivery"])

@router.post("/admin/orders/{order_id}/delivery-event", response_model=DeliveryEventOut)
def add_delivery_event(order_id: int, payload: DeliveryEventCreate, db: Session = Depends(get_db), current_operator: Operator = Depends(get_current_operator)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    event = DeliveryEvent(
        order_id=order.id,
        event_type=payload.event_type,
        location=payload.location,
        city=payload.city,
        pincode=payload.pincode,
        courier_name=payload.courier_name,
        tracking_id=payload.tracking_id,
        next_location=payload.next_location,
        notes=payload.notes
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Auto-trigger FSM if DELIVERED
    if payload.event_type == "DELIVERED" and order.status == "Shipped":
        try:
            # Reusing the FSM transition logic
            req = TransitionRequest(action="deliver")
            transition_order_state(order_id, req, db, current_operator)
        except Exception as e:
            print(f"Failed to auto-transition to delivered: {e}")

    return event

@router.get("/orders/{order_id}/tracking", response_model=list[DeliveryEventOut])
def get_order_tracking(order_id: int, db: Session = Depends(get_db), current_customer = Depends(get_current_customer)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.customer_id != current_customer.id:
        raise HTTPException(status_code=404, detail="Order not found")
        
    return db.query(DeliveryEvent).filter(DeliveryEvent.order_id == order_id).order_by(DeliveryEvent.timestamp.asc()).all()
