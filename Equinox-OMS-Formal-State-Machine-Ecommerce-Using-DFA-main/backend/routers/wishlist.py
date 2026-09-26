from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import WishlistItem, Product
from auth import get_current_customer

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])


@router.get("/")
def get_wishlist(db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    items = db.query(WishlistItem).filter(WishlistItem.customer_id == customer.id).all()
    result = []
    for item in items:
        p = db.query(Product).filter(Product.id == item.product_id).first()
        if p:
            result.append({"wishlist_id": item.id, "product_id": p.id, "name": p.name,
                           "price": p.price, "image_url": p.image_url, "rating": p.rating})
    return result


@router.post("/{product_id}")
def add_to_wishlist(product_id: int, db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    existing = db.query(WishlistItem).filter(WishlistItem.customer_id == customer.id,
                                              WishlistItem.product_id == product_id).first()
    if existing:
        return {"success": True, "message": "Already in wishlist"}
    db.add(WishlistItem(customer_id=customer.id, product_id=product_id))
    db.commit()
    return {"success": True}


@router.delete("/{product_id}")
def remove_from_wishlist(product_id: int, db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    item = db.query(WishlistItem).filter(WishlistItem.customer_id == customer.id,
                                          WishlistItem.product_id == product_id).first()
    if item:
        db.delete(item)
        db.commit()
    return {"success": True}
