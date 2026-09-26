from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SavedPayment
from schemas import SavedPaymentCreate, SavedPaymentOut, validate_upi_id
from auth import get_current_customer
from typing import List

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.get("/saved", response_model=List[SavedPaymentOut])
def get_saved_payments(db: Session = Depends(get_db), current_customer = Depends(get_current_customer)):
    return db.query(SavedPayment).filter(SavedPayment.customer_id == current_customer.id).order_by(SavedPayment.created_at.desc()).all()

@router.post("/saved", response_model=SavedPaymentOut, status_code=201)
def save_payment_method(payload: SavedPaymentCreate, db: Session = Depends(get_db), current_customer = Depends(get_current_customer)):
    if payload.payment_type == "upi":
        if not validate_upi_id(payload.payment_details):
            raise HTTPException(status_code=400, detail="Invalid UPI ID format. Expected format: username@bank")
            
    # Check if already exists
    existing = db.query(SavedPayment).filter(
        SavedPayment.customer_id == current_customer.id,
        SavedPayment.payment_details == payload.payment_details
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Payment method already saved")

    new_payment = SavedPayment(
        customer_id=current_customer.id,
        payment_type=payload.payment_type,
        payment_details=payload.payment_details,
        label=payload.label or f"My {payload.payment_type.upper()}",
        is_default=payload.is_default
    )
    
    # If setting to default, unset others
    if payload.is_default:
        db.query(SavedPayment).filter(SavedPayment.customer_id == current_customer.id).update({"is_default": False})
        
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment

@router.delete("/saved/{payment_id}", status_code=204)
def delete_saved_payment(payment_id: int, db: Session = Depends(get_db), current_customer = Depends(get_current_customer)):
    payment = db.query(SavedPayment).filter(SavedPayment.id == payment_id, SavedPayment.customer_id == current_customer.id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Saved payment not found")
        
    db.delete(payment)
    db.commit()
    return None
