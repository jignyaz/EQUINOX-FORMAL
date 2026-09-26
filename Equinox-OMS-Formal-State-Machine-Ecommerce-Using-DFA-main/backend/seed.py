import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Category, Product, Operator, OperatorRole, AutomatonRule
from auth import hash_password
from dotenv import load_dotenv

load_dotenv()

def seed_data():
    print("Dropping and recreating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Seeding Automaton Rules...")
    rules = [
        AutomatonRule(source_state="Placed", action="process", target_state="Processing", description="Verify payment and start picking."),
        AutomatonRule(source_state="Placed", action="cancel", target_state="Cancelled", description="Customer cancelled before processing."),
        AutomatonRule(source_state="Processing", action="ship", target_state="Shipped", description="Hand over to courier."),
        AutomatonRule(source_state="Processing", action="cancel", target_state="Cancelled", description="Cancelled during processing phase."),
        AutomatonRule(source_state="Shipped", action="deliver", target_state="Delivered", description="Delivered to customer address."),
        AutomatonRule(source_state="Delivered", action="replace", target_state="Processing", description="Customer requested replacement, restarting process."),
        AutomatonRule(source_state="Delivered", action="post_deliver_cancel", target_state="Cancelled", description="Refunded post-delivery.")
    ]
    db.add_all(rules)
    db.commit()
    
    
    # Create admin operator if it doesn't exist
    admin_email = os.getenv("ADMIN_EMAIL", "admin@equinoxoms.com")
    if not db.query(Operator).filter(Operator.email == admin_email).first():
        print(f"Creating admin operator ({admin_email})...")
        admin = Operator(
            name="Super Admin",
            email=admin_email,
            password_hash=hash_password(os.getenv("ADMIN_PASSWORD", "Admin@1234")),
            role=OperatorRole.ADMIN
        )
        db.add(admin)
        db.commit()


    print("Seeding categories...")
    # Top-level categories
    mens = Category(name="Mens", slug="mens", sort_order=1)
    womens = Category(name="Womens", slug="womens", sort_order=2)
    electronics = Category(name="Electronics", slug="electronics", sort_order=3)
    groceries = Category(name="Groceries", slug="groceries", sort_order=4)
    kids = Category(name="Kids", slug="kids", sort_order=5)

    db.add_all([mens, womens, electronics, groceries, kids])
    db.commit()

    # Subcategories
    mens_shirts = Category(name="Shirts", slug="mens-shirts", parent_id=mens.id)
    mens_pants = Category(name="Pants", slug="mens-pants", parent_id=mens.id)
    mens_shoes = Category(name="Shoes", slug="mens-shoes", parent_id=mens.id)
    
    elec_laptops = Category(name="Laptops", slug="laptops", parent_id=electronics.id)
    elec_audio = Category(name="Audio", slug="audio", parent_id=electronics.id)

    db.add_all([mens_shirts, mens_pants, mens_shoes, elec_laptops, elec_audio])
    db.commit()

    print("Seeding products...")
    products = [
        Product(
            name="MacBook Pro 14\"",
            description="M3 Pro chip, 18GB RAM, 512GB SSD. Stunning Liquid Retina XDR display.",
            price=1299.99,
            stock=12,
            category_id=elec_laptops.id,
            image_url="https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400",
            rating=4.8,
            review_count=2340,
            tags="Bestseller"
        ),
        Product(
            name="Sony WH-1000XM5",
            description="Industry-leading noise cancellation with 30-hour battery life.",
            price=349.99,
            stock=34,
            category_id=elec_audio.id,
            image_url="https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400",
            rating=4.7,
            review_count=5120,
            tags="New"
        ),
        Product(
            name="Classic Cotton Shirt",
            description="Premium quality cotton shirt for everyday wear.",
            price=39.99,
            stock=50,
            category_id=mens_shirts.id,
            image_url="https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400",
            rating=4.5,
            review_count=120,
            tags="Hot"
        )
    ]
    db.add_all(products)
    db.commit()

    print("Seeding complete!")
    db.close()

if __name__ == "__main__":
    seed_data()
