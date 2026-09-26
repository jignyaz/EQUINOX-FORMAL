from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
import re


# ── Auth Schemas ──────────────────────────────────────────────────────────────
class CustomerSignup(BaseModel):
    name: str
    email: EmailStr
    phone_code: str = "+91"
    phone_number: Optional[str] = None
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str

class OperatorLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str  # "customer" or "operator"

class CustomerOut(BaseModel):
    id: int
    name: str
    email: str
    phone_code: str
    phone_number: Optional[str]
    created_at: datetime
    class Config: from_attributes = True


# ── Address Schemas ───────────────────────────────────────────────────────────
class AddressCreate(BaseModel):
    label: str = "Home"
    full_name: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pin_code: str
    country: str = "India"
    is_default: bool = False

class AddressOut(AddressCreate):
    id: int
    class Config: from_attributes = True


# ── Saved Payment Schemas ─────────────────────────────────────────────────────
class SavedPaymentCreate(BaseModel):
    payment_type: str  # "upi", "card", "netbanking", "cod"
    payment_details: str  # UPI ID or masked card
    label: Optional[str] = None
    is_default: bool = False

    @field_validator("payment_details")
    @classmethod
    def validate_upi(cls, v, info):
        # Only validate UPI format for UPI type
        # UPI format: localpart@pspprovider
        return v

class SavedPaymentOut(SavedPaymentCreate):
    id: int
    created_at: datetime
    class Config: from_attributes = True


# ── Category Schemas ──────────────────────────────────────────────────────────
class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str]
    parent_id: Optional[int]
    subcategories: Optional[List["CategoryOut"]] = []
    class Config: from_attributes = True

CategoryOut.model_rebuild()


# ── Product Schemas ───────────────────────────────────────────────────────────
class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    original_price: Optional[float]
    stock: int
    category_id: Optional[int]
    image_url: Optional[str]
    rating: float
    review_count: int
    tags: Optional[str]
    class Config: from_attributes = True


# ── Order Schemas ─────────────────────────────────────────────────────────────
class CartItem(BaseModel):
    product_id: int
    quantity: int
    price: float

class ShippingAddress(BaseModel):
    full_name: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pin_code: str
    country: str = "India"
    phone: Optional[str] = None

class PlaceOrderRequest(BaseModel):
    items: List[CartItem]
    shipping_address: ShippingAddress
    payment_type: str
    payment_details: str  # UPI ID or instrument used
    save_payment: bool = False
    address_id: Optional[int] = None  # use saved address if provided

class OrderItemOut(BaseModel):
    product_id: int
    quantity: int
    price_at_purchase: float
    class Config: from_attributes = True

class TimelineEntryOut(BaseModel):
    status: str
    detail: Optional[str]
    timestamp: datetime
    class Config: from_attributes = True


class DeliveryEventCreate(BaseModel):
    event_type: str
    location: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    courier_name: Optional[str] = None
    tracking_id: Optional[str] = None
    next_location: Optional[str] = None
    notes: Optional[str] = None

class DeliveryEventOut(BaseModel):
    id: int
    order_id: int
    event_type: str
    location: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    courier_name: Optional[str] = None
    tracking_id: Optional[str] = None
    next_location: Optional[str] = None
    timestamp: datetime
    notes: Optional[str] = None

    class Config:
        orm_mode = True

class OrderOut(BaseModel):
    id: int
    order_ref: str
    status: str
    subtotal: float
    tax: float
    shipping_charge: float
    total_amount: float
    payment_type: Optional[str]
    shipping_address: Optional[dict]
    est_delivery_date: Optional[str]
    created_at: datetime
    items: List[OrderItemOut] = []
    timeline: List[TimelineEntryOut] = []
    delivery_events: List[DeliveryEventOut] = []
    class Config: from_attributes = True

class TransitionRequest(BaseModel):
    action: str  # process, ship, deliver, cancel, replace, post_deliver_cancel

class TransitionResponse(BaseModel):
    success: bool
    old_state: Optional[str] = None
    new_state: Optional[str] = None
    message: str
    error: Optional[str] = None


# ── Payment Validation ────────────────────────────────────────────────────────
def validate_upi_id(upi_id: str) -> bool:
    """Validates UPI ID format: localpart@pspprovider"""
    pattern = r'^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$'
    return bool(re.match(pattern, upi_id.strip()))
