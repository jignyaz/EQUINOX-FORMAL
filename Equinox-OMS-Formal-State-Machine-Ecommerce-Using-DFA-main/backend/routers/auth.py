from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Customer, Operator, SavedPayment
from schemas import CustomerSignup, CustomerLogin, OperatorLogin, TokenResponse, CustomerOut
from auth import hash_password, verify_password, create_access_token, get_current_customer

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(payload: CustomerSignup, db: Session = Depends(get_db)):
    # Check duplicate email
    if db.query(Customer).filter(Customer.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Check duplicate phone
    if payload.phone_number:
        if db.query(Customer).filter(Customer.phone_number == payload.phone_number).first():
            raise HTTPException(status_code=400, detail="Phone number already registered")

    customer = Customer(
        name=payload.name,
        email=payload.email,
        phone_code=payload.phone_code,
        phone_number=payload.phone_number or None,
        password_hash=hash_password(payload.password)
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    token = create_access_token({"sub": str(customer.id), "role": "customer", "email": customer.email})
    return TokenResponse(access_token=token, role="customer")


@router.post("/login", response_model=TokenResponse)
def login(payload: CustomerLogin, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.email == payload.email).first()
    if not customer or not verify_password(payload.password, customer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not customer.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_access_token({"sub": str(customer.id), "role": "customer", "email": customer.email})
    return TokenResponse(access_token=token, role="customer")


@router.post("/operator/login", response_model=TokenResponse)
def operator_login(payload: OperatorLogin, db: Session = Depends(get_db)):
    operator = db.query(Operator).filter(Operator.email == payload.email).first()
    if not operator or not verify_password(payload.password, operator.password_hash):
        raise HTTPException(status_code=401, detail="Invalid operator credentials")
    if not operator.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_access_token({"sub": str(operator.id), "role": "operator", "email": operator.email})
    return TokenResponse(access_token=token, role="operator")



@router.get("/me")
def get_me(db: Session = Depends(get_db), current_customer: Customer = Depends(get_current_customer)):
    # Return user details + saved payments
    payments = db.query(SavedPayment).filter(SavedPayment.customer_id == current_customer.id).all()
    
    return {
        "id": current_customer.id,
        "name": current_customer.name,
        "email": current_customer.email,
        "phone": (current_customer.phone_code or "") + (current_customer.phone_number or ""),
        "saved_payments": [{"id": p.id, "payment_type": p.payment_type, "payment_details": p.payment_details, "label": p.label} for p in payments]
    }
