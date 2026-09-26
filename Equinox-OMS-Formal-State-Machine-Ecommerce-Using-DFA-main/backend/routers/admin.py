from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Order, OrderTimeline, Operator
from schemas import OrderOut, TransitionRequest, TransitionResponse
from auth import get_current_operator
from fsm import get_next_state
from models import AutomatonRule

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/orders", response_model=List[OrderOut])
def get_all_orders(
    status: Optional[str] = None, 
    db: Session = Depends(get_db), 
    current_operator: Operator = Depends(get_current_operator)
):
    """Get all orders for the operator dashboard"""
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.created_at.desc()).all()


@router.post("/orders/{order_id}/transition", response_model=TransitionResponse)
def transition_order_state(
    order_id: int, 
    request: TransitionRequest, 
    db: Session = Depends(get_db), 
    current_operator: Operator = Depends(get_current_operator)
):
    """
    Operator transitions an order's state using the FSM logic.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_state = order.status
    action = request.action
    
    # Use FSM to determine next state
    next_state, error, detail = get_next_state(db, old_state, action, order)
    
    if error:
        return TransitionResponse(
            success=False,
            message="Transition failed",
            error=error
        )
        
    # Update order status
    order.status = next_state
    
    # Log timeline entry
    detail = detail or f"Transitioned to {next_state}." 
    timeline_entry = OrderTimeline(
        order_id=order.id,
        status=next_state,
        detail=detail,
        operator_id=current_operator.id
    )
    db.add(timeline_entry)
    db.commit()
    
    return TransitionResponse(
        success=True,
        old_state=old_state,
        new_state=next_state,
        message=f"Order transitioned successfully from {old_state} via '{action}' to {next_state}"
    )

@router.get("/orders/{order_id}", response_model=OrderOut)
def get_admin_order(
    order_id: int, 
    db: Session = Depends(get_db), 
    current_operator: Operator = Depends(get_current_operator)
):
    """Get a specific order details for the admin"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ── Dynamic FSM Rules CRUD ──────────────────────────────────────────────────
@router.get("/rules")
def get_all_rules(db: Session = Depends(get_db), current_operator: Operator = Depends(get_current_operator)):
    return db.query(AutomatonRule).all()

@router.post("/rules")
def create_rule(
    source_state: str, action: str, target_state: str, description: str,
    db: Session = Depends(get_db), current_operator: Operator = Depends(get_current_operator)
):
    rule = AutomatonRule(source_state=source_state, action=action, target_state=target_state, description=description)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db), current_operator: Operator = Depends(get_current_operator)):
    rule = db.query(AutomatonRule).filter(AutomatonRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"success": True, "message": "Rule deleted"}

from models import PaymentStatus, InventoryStatus

@router.post("/orders/{order_id}/capture-payment")
def capture_payment(order_id: int, db: Session = Depends(get_db), current_operator: Operator = Depends(get_current_operator)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order: raise HTTPException(status_code=404)
    order.payment_status = PaymentStatus.CAPTURED
    db.commit()
    return {"success": True, "message": "Payment captured"}

@router.post("/orders/{order_id}/consume-inventory")
def consume_inventory(order_id: int, db: Session = Depends(get_db), current_operator: Operator = Depends(get_current_operator)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order: raise HTTPException(status_code=404)
    order.inventory_status = InventoryStatus.CONSUMED
    db.commit()
    return {"success": True, "message": "Inventory consumed"}


@router.get("/orders/{order_id}/actions")
def get_order_actions(
    order_id: int,
    db: Session = Depends(get_db),
    current_operator: Operator = Depends(get_current_operator)
):
    """Returns valid FSM actions for this order current state."""
    from fsm import get_available_actions
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"state": order.status, "actions": get_available_actions(db, order.status)}
