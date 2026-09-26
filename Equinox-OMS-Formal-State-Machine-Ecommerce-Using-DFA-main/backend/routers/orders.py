from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Order, OrderItem, OrderTimeline, OrderStatus, Product, SavedPayment, Address
from schemas import PlaceOrderRequest, OrderOut, TransitionRequest, TransitionResponse
from auth import get_current_customer, get_current_operator
from fsm import get_next_state
import uuid
import datetime

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.post("/", response_model=OrderOut, status_code=201)
def place_order(payload: PlaceOrderRequest, db: Session = Depends(get_db), current_customer = Depends(get_current_customer)):
    
    subtotal = 0.0
    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product or product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} out of stock or not found")
        subtotal += product.price * item.quantity
        product.stock -= item.quantity # Reduce stock
    
    tax = subtotal * 0.08
    shipping_charge = 0.0 if subtotal > 500 else 29.99
    total_amount = subtotal + tax + shipping_charge
    
    order_ref = f"TS-{uuid.uuid4().hex[:8].upper()}"
    est_delivery = (datetime.datetime.now() + datetime.timedelta(days=5)).strftime("%b %d, %Y")
    
    new_order = Order(
        order_ref=order_ref,
        customer_id=current_customer.id,
        status=OrderStatus.PLACED,
        subtotal=subtotal,
        tax=tax,
        shipping_charge=shipping_charge,
        total_amount=total_amount,
        payment_type=payload.payment_type,
        payment_details=payload.payment_details,
        shipping_address=payload.shipping_address.dict(),
        est_delivery_date=est_delivery
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Add items
    for item in payload.items:
        db.add(OrderItem(order_id=new_order.id, product_id=item.product_id, quantity=item.quantity, price_at_purchase=item.price))
        
    # Initial FSM Timeline
    db.add(OrderTimeline(
        order_id=new_order.id,
        status=OrderStatus.PLACED,
        detail="Order confirmed and payment received."
    ))
    db.commit()
    
    # Optionally save payment
    if payload.save_payment:
        # Check if already saved
        existing_payment = db.query(SavedPayment).filter(
            SavedPayment.customer_id == current_customer.id,
            SavedPayment.payment_details == payload.payment_details
        ).first()
        
        if not existing_payment:
            db.add(SavedPayment(
                customer_id=current_customer.id,
                payment_type=payload.payment_type,
                payment_details=payload.payment_details,
                label=f"Saved {payload.payment_type.upper()}"
            ))
            db.commit()
    
    db.refresh(new_order)
    return new_order


@router.get("/me", response_model=list[OrderOut])
def get_my_orders(db: Session = Depends(get_db), current_customer = Depends(get_current_customer)):
    return db.query(Order).filter(Order.customer_id == current_customer.id).order_by(Order.created_at.desc()).all()


# --- FSM Operator Routes ---
@router.post("/{order_id}/transition", response_model=TransitionResponse)
def transition_order_state(order_id: int, payload: TransitionRequest, db: Session = Depends(get_db), current_operator = Depends(get_current_operator)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    current_state = order.status.value
    next_state, error, detail = get_next_state(db, current_state, payload.action, order)
    
    if error:
        raise HTTPException(status_code=400, detail=error)
        
    order.status = next_state
    
    db.add(OrderTimeline(
        order_id=order.id,
        status=next_state,
        detail=detail or f"Transitioned to {next_state}",
        operator_id=current_operator.id
    ))
    
    db.commit()
    return TransitionResponse(
        success=True,
        old_state=current_state,
        new_state=next_state,
        message=f"Order transitioned from {current_state} via '{payload.action}' to {next_state}"
    )


@router.post("/{order_id}/cancel")
def cancel_order(order_id: int, db: Session = Depends(get_db), current_customer = Depends(get_current_customer)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.customer_id != current_customer.id:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # The rule is: can only cancel if Placed or Processing. If Shipped, not allowed.
    if order.status not in ["Placed", "Processing"]:
        if order.status == "Shipped":
            raise HTTPException(status_code=400, detail="Order has already been shipped. It can only be returned upon delivery.")
        raise HTTPException(status_code=400, detail="Order cannot be cancelled at this stage.")
        
    # We trigger the FSM transition manually
    from models import OrderTimeline, AutomatonRule
    
    rule = db.query(AutomatonRule).filter(
        AutomatonRule.source_state == order.status,
        AutomatonRule.action == "cancel"
    ).first()
    
    if not rule:
        raise HTTPException(status_code=400, detail="Cancellation transition not allowed")
        
    old_state = order.status
    order.status = rule.target_state
    
    timeline_entry = OrderTimeline(
        order_id=order.id,
        status=rule.target_state,
        detail=rule.description or f"Order cancelled by customer",
        operator_id=None
    )
    db.add(timeline_entry)
    db.commit()
    
    return {"success": True, "old_state": old_state, "new_state": rule.target_state}

@router.post("/{order_id}/return")
def return_order(order_id: int, db: Session = Depends(get_db), current_customer = Depends(get_current_customer)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.customer_id != current_customer.id:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.status != "Delivered":
        raise HTTPException(status_code=400, detail="Order must be delivered to request a return.")
        
    from models import OrderTimeline, AutomatonRule
    rule = db.query(AutomatonRule).filter(
        AutomatonRule.source_state == order.status,
        AutomatonRule.action == "return_request"
    ).first()
    
    if not rule:
        raise HTTPException(status_code=400, detail="Return transition not allowed")
        
    old_state = order.status
    order.status = rule.target_state
    
    db.add(OrderTimeline(
        order_id=order.id,
        status=rule.target_state,
        detail=rule.description or "Customer requested a return",
        operator_id=None
    ))
    db.commit()
    return {"success": True, "old_state": old_state, "new_state": rule.target_state}

@router.post("/{order_id}/replace")
def replace_order(order_id: int, db: Session = Depends(get_db), current_customer = Depends(get_current_customer)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.customer_id != current_customer.id:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.status != "Delivered":
        raise HTTPException(status_code=400, detail="Order must be delivered to request a replacement.")
        
    from models import OrderTimeline, AutomatonRule
    rule = db.query(AutomatonRule).filter(
        AutomatonRule.source_state == order.status,
        AutomatonRule.action == "replace_request"
    ).first()
    
    if not rule:
        raise HTTPException(status_code=400, detail="Replace transition not allowed")
        
    old_state = order.status
    order.status = rule.target_state
    
    db.add(OrderTimeline(
        order_id=order.id,
        status=rule.target_state,
        detail=rule.description or "Customer requested a replacement",
        operator_id=None
    ))
    db.commit()
    return {"success": True, "old_state": old_state, "new_state": rule.target_state}
