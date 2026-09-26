from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Coupon
from auth import get_current_customer
import datetime

router = APIRouter(prefix="/api/coupons", tags=["Coupons"])


class CouponValidate(BaseModel):
    code: str
    order_total: float


@router.post("/validate")
def validate_coupon(payload: CouponValidate, db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    coupon = db.query(Coupon).filter(Coupon.code == payload.code.upper(), Coupon.is_active == True).first()
    if not coupon:
        raise HTTPException(400, "Invalid or expired coupon code")
    if coupon.expires_at and coupon.expires_at < datetime.datetime.utcnow():
        raise HTTPException(400, "Coupon has expired")
    if coupon.used_count >= coupon.max_uses:
        raise HTTPException(400, "Coupon usage limit reached")
    if payload.order_total < coupon.min_order_value:
        raise HTTPException(400, f"Minimum order value of ${coupon.min_order_value} required for this coupon")

    if coupon.discount_type == "percent":
        discount = round(payload.order_total * coupon.discount_value / 100, 2)
    else:
        discount = min(coupon.discount_value, payload.order_total)

    return {
        "valid": True,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "discount_amount": discount,
        "new_total": round(payload.order_total - discount, 2)
    }
