from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Address
from schemas import AddressCreate, AddressOut
from auth import get_current_customer
from typing import List

router = APIRouter(prefix="/api/addresses", tags=["Addresses"])

@router.get("/", response_model=List[AddressOut])
def get_addresses(db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    return db.query(Address).filter(Address.customer_id == customer.id).order_by(Address.is_default.desc(), Address.id.desc()).all()

@router.post("/", response_model=AddressOut)
def create_address(payload: AddressCreate, db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    new_address = Address(
        customer_id=customer.id,
        label=payload.label,
        full_name=payload.full_name,
        line1=payload.line1,
        line2=payload.line2,
        city=payload.city,
        state=payload.state,
        pin_code=payload.pin_code,
        country=payload.country,
        is_default=payload.is_default
    )
    
    if payload.is_default:
        db.query(Address).filter(Address.customer_id == customer.id).update({"is_default": False})
        
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    
    if db.query(Address).filter(Address.customer_id == customer.id).count() == 1:
        new_address.is_default = True
        db.commit()
        db.refresh(new_address)
        
    return new_address

@router.put("/{address_id}/default")
def set_default(address_id: int, db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    addr = db.query(Address).filter(Address.id == address_id, Address.customer_id == customer.id).first()
    if not addr:
        raise HTTPException(404, "Address not found")
        
    db.query(Address).filter(Address.customer_id == customer.id).update({"is_default": False})
    addr.is_default = True
    db.commit()
    return {"success": True}
