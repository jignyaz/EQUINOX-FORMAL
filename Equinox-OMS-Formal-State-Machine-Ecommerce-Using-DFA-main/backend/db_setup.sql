-- PostgreSQL Database Setup Script for Equinox OMS E-commerce OMS
-- To run this script, connect to your PostgreSQL server via psql or pgAdmin.
-- Example: psql -U postgres -f db_setup.sql

-- 1. Create Database and User (Uncomment if needed, usually run separately as a superuser)
-- CREATE DATABASE techstore;
-- CREATE USER techstore_admin WITH PASSWORD 'techstore_password';
-- GRANT ALL PRIVILEGES ON DATABASE techstore TO techstore_admin;

-- Connect to the database
-- \c techstore

-- 2. Create Custom Enum Types
CREATE TYPE order_status AS ENUM ('Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
CREATE TYPE payment_type AS ENUM ('upi', 'card', 'netbanking', 'cod');
CREATE TYPE operator_role AS ENUM ('admin', 'manager');

-- 3. Create Tables

-- Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    phone_code VARCHAR(10) NOT NULL DEFAULT '+91',
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customers_email ON customers(email);

-- Addresses Table
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    full_name VARCHAR(120) NOT NULL,
    line1 VARCHAR(250) NOT NULL,
    line2 VARCHAR(250),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_default BOOLEAN DEFAULT FALSE
);

-- Saved Payments Table
CREATE TABLE saved_payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    payment_type payment_type NOT NULL,
    payment_details VARCHAR(200) NOT NULL,
    label VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Operators Table
CREATE TABLE operators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role operator_role DEFAULT 'manager',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_operators_email ON operators(email);

-- Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    icon VARCHAR(10),
    parent_id INTEGER REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DOUBLE PRECISION NOT NULL,
    original_price DOUBLE PRECISION,
    stock INTEGER DEFAULT 0,
    category_id INTEGER REFERENCES categories(id),
    image_url VARCHAR(500),
    images JSON DEFAULT '[]'::json,
    rating DOUBLE PRECISION DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    tags VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_ref VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    status order_status DEFAULT 'Placed',
    subtotal DOUBLE PRECISION DEFAULT 0.0,
    tax DOUBLE PRECISION DEFAULT 0.0,
    shipping_charge DOUBLE PRECISION DEFAULT 0.0,
    total_amount DOUBLE PRECISION DEFAULT 0.0,
    payment_type payment_type,
    payment_details VARCHAR(200),
    shipping_address JSON,
    est_delivery_date VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase DOUBLE PRECISION NOT NULL
);

-- Order Timeline (FSM trace) Table
CREATE TABLE order_timeline (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    detail VARCHAR(300),
    operator_id INTEGER REFERENCES operators(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Initial Seed Data
-- Seed an Admin Operator
INSERT INTO operators (name, email, password_hash, role) 
VALUES ('Super Admin', 'admin@equinoxoms.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin'); 
-- Note: Password hash corresponds to 'Admin@1234' using bcrypt (cost 12)

-- Seed Categories
INSERT INTO categories (id, name, slug, sort_order) VALUES
(1, 'Electronics', 'electronics', 1),
(2, 'Mens Fashion', 'mens-fashion', 2),
(3, 'Womens Fashion', 'womens-fashion', 3),
(4, 'Groceries', 'groceries', 4),
(5, 'Home & Kitchen', 'home-kitchen', 5);

INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
('Laptops', 'laptops', 1, 1),
('Smartphones', 'smartphones', 1, 2),
('Shirts', 'mens-shirts', 2, 1),
('Shoes', 'mens-shoes', 2, 2);

-- Reset sequence for categories
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- Seed Products
INSERT INTO products (name, description, price, stock, category_id, image_url, tags) VALUES
('MacBook Pro 14"', 'M3 Pro chip, 18GB RAM, 512GB SSD. Stunning Liquid Retina XDR display.', 1299.99, 12, 1, 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400', 'Bestseller'),
('Sony WH-1000XM5', 'Industry-leading noise cancellation with 30-hour battery life.', 349.99, 34, 1, 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400', 'New'),
('Men''s Classic White Shirt', '100% Cotton, slim fit white dress shirt.', 45.00, 50, 2, 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400', 'Essential');
