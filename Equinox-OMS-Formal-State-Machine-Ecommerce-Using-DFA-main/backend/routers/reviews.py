from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Review, Product, Order
from auth import get_current_customer

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


class ReviewCreate(BaseModel):
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None
    order_id: Optional[int] = None


@router.post("/products/{product_id}")
def create_review(product_id: int, payload: ReviewCreate, db: Session = Depends(get_db), customer = Depends(get_current_customer)):
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(400, "Rating must be 1-5")
    existing = db.query(Review).filter(Review.product_id == product_id, Review.customer_id == customer.id).first()
    if existing:
        raise HTTPException(400, "You already reviewed this product")
    review = Review(product_id=product_id, customer_id=customer.id,
                    order_id=payload.order_id, rating=payload.rating,
                    title=payload.title, body=payload.body)
    db.add(review)
    # Update product aggregate rating
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        reviews_list = db.query(Review).filter(Review.product_id == product_id).all()
        total = sum(r.rating for r in reviews_list) + payload.rating
        product.review_count = len(reviews_list) + 1
        product.rating = round(total / product.review_count, 1)
    db.commit()
    return {"success": True}


@router.get("/products/{product_id}")
def get_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()
    result = []
    for r in reviews:
        result.append({"id": r.id, "rating": r.rating, "title": r.title, "body": r.body,
                       "customer_name": r.customer.name if r.customer else "User",
                       "created_at": r.created_at})
    return result
