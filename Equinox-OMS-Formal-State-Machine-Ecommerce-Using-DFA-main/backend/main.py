from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, catalog, orders, payments, admin, delivery, support, wishlist, reviews, notifications, coupons, addresses

# Create tables if they don't exist (though db_setup.sql is preferred)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Equinox OMS E-commerce API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(delivery.router)
app.include_router(support.router)
app.include_router(wishlist.router)
app.include_router(reviews.router)
app.include_router(notifications.router)
app.include_router(coupons.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Equinox OMS E-commerce API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

app.include_router(addresses.router)
