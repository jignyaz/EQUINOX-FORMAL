# Equinox OMS (Order Management System)

Equinox OMS is an enterprise-grade e-commerce platform built around a strict **Formal State Machine (FSM)** and **Deterministic Finite Automata (DFA)**. By mathematically modeling the order lifecycle, Equinox guarantees robust, error-free order state transitions from checkout to delivery.

---

## ⚙️ Architecture & FSM Integration

At the heart of Equinox OMS is a DFA-based rule engine. In traditional e-commerce platforms, order states (e.g., *Placed*, *Shipped*, *Delivered*) are often loosely coupled strings updated via arbitrary API endpoints, leading to illegal transitions (e.g., cancelling an order that is already delivered).

Equinox solves this by treating the order lifecycle as a formal automaton:
- **States (Q)**: `Placed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`
- **Alphabet/Events (Σ)**: `process`, `ship`, `deliver`, `cancel`, `replace`, `post_deliver_cancel`
- **Transition Function (δ)**: Enforced centrally via `AutomatonRule` entities.

If an event (action) is not explicitly defined for a given source state in the DFA matrix, the transition is mathematically rejected by the backend, ensuring 100% data integrity.

### Allowed DFA Transitions
| Current State | Action/Event | Target State |
| :--- | :--- | :--- |
| **Placed** | `process` | Processing |
| **Placed** | `cancel` | Cancelled |
| **Processing** | `ship` | Shipped |
| **Processing** | `cancel` | Cancelled |
| **Shipped** | `deliver` | Delivered |
| **Delivered** | `replace` | Processing (Return/Replace) |
| **Delivered** | `post_deliver_cancel` | Cancelled (Refund) |

---

## 🛠️ Tech Stack

Equinox OMS is built with a modern, decoupled architecture designed for high performance and scalability.

**Frontend:**
- **Next.js 14** (App Router, Server Components)
- **React.js** (Hooks, Context API)
- **Tailwind CSS** (Utility-first styling, Glassmorphism UI)
- **Lucide React** (Iconography)

**Backend:**
- **FastAPI** (High-performance Python web framework)
- **SQLAlchemy** (ORM for Database Management)
- **PostgreSQL / SQLite** (Relational Database)
- **Pydantic** (Data validation and serialization)
- **JWT** (Stateless authentication)

**Integrations:**
- **Pollinations AI**: Dynamic, real-time photorealistic product image generation.

---

## 🚀 Features

- **Automata-Driven Admin Dashboard:** A dedicated backend admin interface to visually track and execute FSM transitions for all active orders.
- **Dynamic Catalog:** Rich product catalog with instant AI-generated product photography.
- **Real-time Cart & Checkout:** Fluid cart state management synchronized with the backend.
- **Role-Based Access Control (RBAC):** Strict JWT segregation between standard Customers and System Administrators.
- **Search & Filtering:** Advanced parsing algorithm for searching products by category, tags, and price logic.

---

## 💻 Local Setup & Installation

**Prerequisites:**
- Node.js (v18+)
- Python (3.10+)

### 1. Start the System
You can launch both the FastAPI backend and Next.js frontend simultaneously using the orchestrator script:
```bash
python app.py
```
*Alternatively, you can run them separately:*

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*Backend will run on `http://127.0.0.1:8000`*

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run on `http://localhost:3000`*

---

## 📝 License
This project was developed as a comprehensive demonstration of integrating Formal Language and Automata Theory (FLA) into modern full-stack web applications.
