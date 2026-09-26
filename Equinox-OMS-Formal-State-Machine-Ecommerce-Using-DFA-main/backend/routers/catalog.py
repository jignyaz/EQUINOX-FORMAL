from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Category, Product
from schemas import CategoryOut, ProductOut
from search_parser import SearchParser

router = APIRouter(prefix="/api/catalog", tags=["Catalog"])

@router.get("/categories", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    """Get all top-level categories with their subcategories"""
    categories = db.query(Category).filter(Category.parent_id == None).order_by(Category.sort_order).all()
    return categories

@router.get("/products", response_model=List[ProductOut])
def get_products(category_id: Optional[int] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    """Get products, optionally filtered by category or search term"""
    query = db.query(Product).filter(Product.is_active == True)
    
    if category_id:
        # Get category and subcategories
        cat_ids = [category_id]
        subcats = db.query(Category.id).filter(Category.parent_id == category_id).all()
        cat_ids.extend([c.id for c in subcats])
        query = query.filter(Product.category_id.in_(cat_ids))
        

    if search:
        parser = SearchParser()
        parsed = parser.parse(search)
        
        # 1. Keywords
        for kw in parsed["keywords"]:
            query = query.filter(Product.name.ilike(f"%{kw}%") | Product.description.ilike(f"%{kw}%"))
            
        # 2. Category
        if parsed["category"]:
            cat = db.query(Category).filter(Category.slug.ilike(parsed["category"])).first()
            if cat:
                cat_ids = [cat.id]
                subcats = db.query(Category.id).filter(Category.parent_id == cat.id).all()
                cat_ids.extend([c.id for c in subcats])
                query = query.filter(Product.category_id.in_(cat_ids))
                
        # 3. Tags
        for tag in parsed["tags"]:
            query = query.filter(Product.tags.ilike(f"%{tag}%"))
            
        # 4. Price Conditions
        for cond in parsed["price_conds"]:
            op = cond["op"]
            val = cond["val"]
            if op == "<":
                query = query.filter(Product.price < val)
            elif op == "<=":
                query = query.filter(Product.price <= val)
            elif op == ">":
                query = query.filter(Product.price > val)
            elif op == ">=":
                query = query.filter(Product.price >= val)
            elif op == "==" or op == "=":
                query = query.filter(Product.price == val)

        
    return query.all()

@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
