from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────
class OrderStatus(str, enum.Enum):
    PLACED = "Placed"
    PROCESSING = "Processing"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"

class PaymentType(str, enum.Enum):
    UPI = "upi"
    CARD = "card"
    NETBANKING = "netbanking"
    COD = "cod"

class InventoryStatus(str, enum.Enum):
    RESERVED = "Reserved"
    CONSUMED = "Consumed"
    RESTOCKED = "Restocked"

class PaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    CAPTURED = "Captured"
    FAILED = "Failed"
    REFUNDED = "Refunded"

class OperatorRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"


# ── Automata Rules (Dynamic FSM) ──────────────────────────────────────────────
class AutomatonRule(Base):
    __tablename__ = "automaton_rules"
    id           = Column(Integer, primary_key=True, index=True)
    source_state = Column(String(50), nullable=False)
    action       = Column(String(50), nullable=False)
    target_state = Column(String(50), nullable=False)
    description  = Column(String(200))

# ── Customers ─────────────────────────────────────────────────────────────────
class Customer(Base):
    __tablename__ = "customers"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(120), nullable=False)
    email        = Column(String(200), unique=True, index=True, nullable=False)
    phone_code   = Column(String(10), nullable=False, default="+91")
    phone_number = Column(String(20), unique=True, nullable=True)
    password_hash= Column(String(256), nullable=False)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    addresses      = relationship("Address", back_populates="customer", cascade="all, delete-orphan")
    saved_payments = relationship("SavedPayment", back_populates="customer", cascade="all, delete-orphan")
    orders         = relationship("Order", back_populates="customer")


# ── Addresses ─────────────────────────────────────────────────────────────────
class Address(Base):
    __tablename__ = "addresses"
    id          = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    label       = Column(String(50), default="Home")   # Home, Work, Other
    full_name   = Column(String(120), nullable=False)
    line1       = Column(String(250), nullable=False)
    line2       = Column(String(250))
    city        = Column(String(100), nullable=False)
    state       = Column(String(100), nullable=False)
    pin_code    = Column(String(20), nullable=False)
    country     = Column(String(100), default="India")
    is_default  = Column(Boolean, default=False)

    customer = relationship("Customer", back_populates="addresses")


# ── Saved Payments ─────────────────────────────────────────────────────────────
class SavedPayment(Base):
    __tablename__ = "saved_payments"
    id              = Column(Integer, primary_key=True, index=True)
    customer_id     = Column(Integer, ForeignKey("customers.id"), nullable=False)
    payment_type    = Column(Enum(PaymentType), nullable=False)
    # For UPI: stores the UPI ID | For Card: masked number like ****1234
    payment_details = Column(String(200), nullable=False)
    label           = Column(String(100))          # e.g. "My PhonePe UPI"
    is_default      = Column(Boolean, default=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="saved_payments")


# ── Operators (Store Staff) ───────────────────────────────────────────────────
class Operator(Base):
    __tablename__ = "operators"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(120), nullable=False)
    email         = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role          = Column(Enum(OperatorRole), default=OperatorRole.MANAGER)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    order_timelines = relationship("OrderTimeline", back_populates="operator")


# ── Categories ─────────────────────────────────────────────────────────────────
class Category(Base):
    __tablename__ = "categories"
    id        = Column(Integer, primary_key=True, index=True)
    name      = Column(String(100), nullable=False)
    slug      = Column(String(120), unique=True, nullable=False)
    icon      = Column(String(10))            # emoji
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    sort_order= Column(Integer, default=0)

    parent    = relationship("Category", remote_side=[id], backref="subcategories")
    products  = relationship("Product", back_populates="category")


# ── Products ──────────────────────────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(200), nullable=False)
    description = Column(Text)
    price       = Column(Float, nullable=False)
    original_price = Column(Float)           # for showing strikethrough discount
    stock       = Column(Integer, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"))
    image_url   = Column(String(500))
    images      = Column(JSON, default=[])   # list of additional image URLs
    rating      = Column(Float, default=0.0)
    review_count= Column(Integer, default=0)
    tags        = Column(String(200))        # comma-separated: "bestseller,hot"
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    category    = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")


# ── Orders ────────────────────────────────────────────────────────────────────
class Order(Base):
    __tablename__ = "orders"
    id               = Column(Integer, primary_key=True, index=True)
    order_ref        = Column(String(20), unique=True, nullable=False)  # TS-XXXXXXXX
    customer_id      = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status           = Column(String(50), default=OrderStatus.PLACED.value)
    payment_status   = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    inventory_status = Column(Enum(InventoryStatus), default=InventoryStatus.RESERVED)
    subtotal         = Column(Float, default=0.0)
    tax              = Column(Float, default=0.0)
    shipping_charge  = Column(Float, default=0.0)
    total_amount     = Column(Float, default=0.0)
    payment_type     = Column(Enum(PaymentType))
    payment_details  = Column(String(200))       # masked UPI/card used
    shipping_address = Column(JSON)              # snapshot of address at order time
    est_delivery_date= Column(String(50))
    notes            = Column(Text)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    customer  = relationship("Customer", back_populates="orders")
    items     = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    timeline  = relationship("OrderTimeline", back_populates="order", cascade="all, delete-orphan")
    delivery_events = relationship("DeliveryEvent", back_populates="order", cascade="all, delete-orphan")


# ── Order Items ───────────────────────────────────────────────────────────────
class OrderItem(Base):
    __tablename__ = "order_items"
    id               = Column(Integer, primary_key=True, index=True)
    order_id         = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id       = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity         = Column(Integer, nullable=False, default=1)
    price_at_purchase= Column(Float, nullable=False)   # snapshot price

    order   = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


# ── Order Timeline (FSM trace) ─────────────────────────────────────────────────
class OrderTimeline(Base):
    __tablename__ = "order_timeline"
    id          = Column(Integer, primary_key=True, index=True)
    order_id    = Column(Integer, ForeignKey("orders.id"), nullable=False)
    status      = Column(String(50), nullable=False)
    detail      = Column(String(300))
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)  # null = customer action
    timestamp   = Column(DateTime(timezone=True), server_default=func.now())

    order    = relationship("Order", back_populates="timeline")
    operator = relationship("Operator", back_populates="order_timelines")


# ── Delivery Events (Live Shipment Tracking) ──────────────────────────────
class DeliveryEvent(Base):
    __tablename__ = "delivery_events"
    id            = Column(Integer, primary_key=True, index=True)
    order_id      = Column(Integer, ForeignKey("orders.id"), nullable=False)
    event_type    = Column(String(50), nullable=False)
    # PICKED_UP | IN_TRANSIT | AT_HUB | OUT_FOR_DELIVERY | DELIVERED | FAILED_ATTEMPT
    location      = Column(String(200))      # "DHL Hub, Bengaluru South"
    city          = Column(String(100))
    pincode       = Column(String(20))
    courier_name  = Column(String(100))      # "Delhivery / BlueDart"
    tracking_id   = Column(String(100))      # AWB number
    next_location = Column(String(200))      # Predicted next hub
    expected_time = Column(String(100))      # "Tomorrow by 9 PM"
    notes         = Column(Text)
    timestamp     = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="delivery_events")


# ── Support Tickets ───────────────────────────────────────────────────────
class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id           = Column(Integer, primary_key=True, index=True)
    order_id     = Column(Integer, ForeignKey("orders.id"), nullable=True)
    customer_id  = Column(Integer, ForeignKey("customers.id"), nullable=False)
    subject      = Column(String(200), nullable=False)
    description  = Column(Text, nullable=False)
    category     = Column(String(50), default="general")
    # damaged | wrong_item | not_received | refund | general
    status       = Column(String(20), default="Open")
    # Open | In Review | Resolved | Closed
    admin_response = Column(Text)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at  = Column(DateTime(timezone=True), nullable=True)

    customer = relationship("Customer", backref="tickets")
    order    = relationship("Order", backref="tickets")


# ── Wishlist ──────────────────────────────────────────────────────────────
class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    id          = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id  = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", backref="wishlist_items")
    product  = relationship("Product", backref="wishlist_items")


# ── Product Reviews ───────────────────────────────────────────────────────
class Review(Base):
    __tablename__ = "reviews"
    id          = Column(Integer, primary_key=True, index=True)
    product_id  = Column(Integer, ForeignKey("products.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_id    = Column(Integer, ForeignKey("orders.id"), nullable=True)
    rating      = Column(Integer, nullable=False)  # 1-5
    title       = Column(String(200))
    body        = Column(Text)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    product  = relationship("Product", backref="reviews")
    customer = relationship("Customer", backref="reviews")


# ── Coupons ───────────────────────────────────────────────────────────────
class Coupon(Base):
    __tablename__ = "coupons"
    id              = Column(Integer, primary_key=True, index=True)
    code            = Column(String(50), unique=True, nullable=False)
    discount_type   = Column(String(20), default="percent")  # percent | flat
    discount_value  = Column(Float, nullable=False)           # e.g. 10 for 10%
    min_order_value = Column(Float, default=0.0)
    max_uses        = Column(Integer, default=100)
    used_count      = Column(Integer, default=0)
    is_active       = Column(Boolean, default=True)
    expires_at      = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


# ── Notifications ─────────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"
    id          = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    title       = Column(String(200), nullable=False)
    body        = Column(String(500))
    type        = Column(String(50), default="info")  # info|success|warning|order
    is_read     = Column(Boolean, default=False)
    order_id    = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", backref="notifications")
