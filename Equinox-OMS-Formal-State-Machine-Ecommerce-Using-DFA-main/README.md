# ⚡ Equinox OMS

<p align="center">
  <strong>Order Management System powered by Formal State Machines and Deterministic Finite Automata</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/PostgreSQL%20%2F%20SQLite-336791?style=for-the-badge&logo=postgresql" alt="Database">
</p>

---

## 📖 Overview

**Equinox OMS (Order Management System)** is a modern full-stack e-commerce platform designed around a strict **Formal State Machine (FSM)** and **Deterministic Finite Automaton (DFA)**.

The project demonstrates how concepts from **Formal Language and Automata Theory** can be applied to a real-world software system.

Instead of allowing an order's status to be changed arbitrarily, Equinox OMS defines a finite set of states and events. Every state transition must follow a predefined automaton rule.

This makes the order lifecycle:

- Deterministic
- Predictable
- Centralized
- Validated
- Maintainable
- Resistant to invalid state transitions

---

## 🎯 Problem Statement

In a conventional e-commerce application, order status is often managed using scattered conditional logic.

This can result in invalid transitions such as:

- `Delivered → Shipped`
- `Cancelled → Processing`
- `Shipped → Processing`
- `Cancelled → Delivered`

Equinox OMS addresses this problem by introducing a formal transition system.

Each order has a current state, and every operation is treated as an event. The backend checks whether the requested event is valid for the current state.

If a transition is not explicitly defined, the operation is rejected.

---

## 💡 Core Idea

The core principle of Equinox OMS is:

> **An order can change its state only when a valid transition rule exists for the current state and requested event.**

The system defines two important components:

### States

- `Placed`
- `Processing`
- `Shipped`
- `Delivered`
- `Cancelled`

### Events

- `process`
- `ship`
- `deliver`
- `cancel`
- `replace`
- `post_deliver_cancel`

The transition function determines the next state.

---

# 🧠 Formal State Machine

The order lifecycle can be represented using a finite state machine:

**FSM = (Q, Σ, δ, q₀)**

Where:

| Symbol | Meaning | Equinox OMS |
|---|---|---|
| `Q` | Set of states | Order states |
| `Σ` | Set of events | Order operations |
| `δ` | Transition function | Automaton rules |
| `q₀` | Initial state | `Placed` |

### State Set

```text
Q = {
    Placed,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}
```

### Event Alphabet

```text
Σ = {
    process,
    ship,
    deliver,
    cancel,
    replace,
    post_deliver_cancel
}
```

### Initial State

```text
q₀ = Placed
```

---

# 🔄 Order Lifecycle

The normal order lifecycle is:

```text
Placed
   │
   │ process
   ▼
Processing
   │
   │ ship
   ▼
Shipped
   │
   │ deliver
   ▼
Delivered
```

Orders can also be cancelled or replaced depending on their current state.

```text
                       ┌──────────────┐
                       │   Cancelled  │
                       └──────────────┘
                         ▲          ▲
                         │          │
                      cancel      post_deliver_cancel
                         │          │
                         │          │
┌────────┐   process   ┌────────────┐   ship   ┌─────────┐
│ Placed │ ──────────> │ Processing │ ──────> │ Shipped │
└────────┘             └────────────┘          └────┬────┘
     │                       │                      │
     │ cancel                │ cancel              │ deliver
     └───────────────────────┴──────────────────────▼
                                               ┌───────────┐
                                               │ Delivered │
                                               └─────┬─────┘
                                                     │
                                                   replace
                                                     │
                                                     ▼
                                               Processing
```

---

# 📐 DFA Model

Equinox OMS applies the concept of a **Deterministic Finite Automaton** to order management.

A DFA can be represented as:

**M = (Q, Σ, δ, q₀, F)**

Where:

- `Q` = finite set of states
- `Σ` = finite set of input symbols
- `δ` = transition function
- `q₀` = initial state
- `F` = final/accepting states

For Equinox OMS:

```text
Q = {
    Placed,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}
```

```text
Σ = {
    process,
    ship,
    deliver,
    cancel,
    replace,
    post_deliver_cancel
}
```

Initial state:

```text
q₀ = Placed
```

---

# 🚦 Transition Rules

The transition function is centrally enforced using `AutomatonRule` entities.

Only explicitly defined transitions are allowed.

| Current State | Event | Next State | Description |
|---|---|---|---|
| `Placed` | `process` | `Processing` | Begin order processing |
| `Placed` | `cancel` | `Cancelled` | Cancel placed order |
| `Processing` | `ship` | `Shipped` | Ship processed order |
| `Processing` | `cancel` | `Cancelled` | Cancel during processing |
| `Shipped` | `deliver` | `Delivered` | Mark order as delivered |
| `Delivered` | `replace` | `Processing` | Start replacement workflow |
| `Delivered` | `post_deliver_cancel` | `Cancelled` | Cancel/refund after delivery |

---

# ❌ Invalid Transitions

If an event is not explicitly defined for the current state, the backend rejects the transition.

For example:

```text
Delivered + ship
```

is invalid because there is no transition:

```text
Delivered → Shipped
```

Similarly:

```text
Cancelled + process
```

is invalid because a cancelled order does not have a `process` transition.

This validation is performed by the backend rather than relying only on frontend restrictions.

---

# 🏗️ System Architecture

Equinox OMS follows a modern full-stack architecture:

```text
                    ┌───────────────────┐
                    │       User        │
                    │     / Admin       │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │    Next.js 14     │
                    │     Frontend      │
                    └─────────┬─────────┘
                              │
                         REST API
                              │
                              ▼
                    ┌───────────────────┐
                    │      FastAPI      │
                    │      Backend      │
                    └─────────┬─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
     ┌──────────────┐  ┌────────────┐  ┌──────────────┐
     │  Automaton   │  │    Auth    │  │   Business   │
     │    Rules     │  │   / RBAC   │  │    Logic     │
     └──────────────┘  └────────────┘  └──────────────┘
            │
            ▼
     ┌──────────────────┐
     │    SQLAlchemy    │
     │       ORM        │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ PostgreSQL /     │
     │ SQLite Database  │
     └──────────────────┘
```

---

# ✨ Features

## 🤖 Automata-Driven Order Management

The order lifecycle is controlled by formal state-transition rules.

Every requested operation is validated against the current order state.

---

## 📊 Admin Dashboard

Provides an administration interface for managing and monitoring the e-commerce platform.

---

## 🛍️ Dynamic Product Catalog

Products can be dynamically displayed and managed through the platform.

---

## 🛒 Real-Time Cart & Checkout

Users can:

- Browse products
- Add products to the cart
- Manage cart items
- Proceed through checkout
- Create orders

---

## 🔐 Role-Based Access Control

The system supports role-based access control to distinguish between different user permissions.

---

## 🔎 Search & Filtering

The product catalog supports search and filtering functionality.

---

## 🖼️ AI-Generated Product Images

The project integrates **Pollinations AI** for dynamic, real-time photorealistic product image generation.

---

## 🔄 Deterministic Order Lifecycle

Orders can only move through explicitly defined states.

This prevents unexpected or invalid state changes.

---

# 🛠️ Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| Next.js 14 | Full-stack React framework |
| React.js | User interface |
| React Hooks | Component state and lifecycle |
| Context API | Global state management |
| Tailwind CSS | Styling |
| Glassmorphism UI | Visual design |
| Lucide React | Icons |

## Backend

| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python | Backend development |
| SQLAlchemy | Object-relational mapping |
| PostgreSQL | Production database |
| SQLite | Local/lightweight database |
| Pydantic | Data validation |
| JWT | Authentication |

## AI / Integration

| Technology | Purpose |
|---|---|
| Pollinations AI | Dynamic product image generation |

---

# 📂 Project Structure

```text
equinox-oms/
│
├── backend/
│   ├── ...
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── app.py
│
└── README.md
```

> The exact internal structure may vary depending on the implementation.

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure the following software is installed:

- Node.js `v18+`
- Python `3.10+`
- npm
- Git

---

# 🐍 Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

## Windows

Activate the environment:

```bash
venv\Scripts\activate
```

## Linux / macOS

```bash
source venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
python main.py
```

The backend runs at:

```text
http://127.0.0.1:8000
```

---

# 🌐 Frontend Setup

Open a new terminal.

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

---

# 🚀 Running the Application

The project also includes an orchestrator:

```bash
python app.py
```

Alternatively, run the backend and frontend independently.

### Backend

```bash
cd backend
python main.py
```

### Frontend

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# 🛒 Order Workflow

## 1. Place Order

A newly created order begins in:

```text
Placed
```

---

## 2. Process Order

Event:

```text
process
```

Transition:

```text
Placed → Processing
```

---

## 3. Ship Order

Event:

```text
ship
```

Transition:

```text
Processing → Shipped
```

---

## 4. Deliver Order

Event:

```text
deliver
```

Transition:

```text
Shipped → Delivered
```

---

## 5. Replace Order

If a replacement is required:

```text
Delivered → Processing
```

Event:

```text
replace
```

---

## 6. Post-Delivery Cancellation

A post-delivery cancellation/refund can be represented by:

```text
Delivered → Cancelled
```

Event:

```text
post_deliver_cancel
```

---

# 🔐 Authentication & Authorization

Equinox OMS uses **JWT-based authentication**.

JSON Web Tokens are used to authenticate requests between the frontend and backend.

The application also implements **Role-Based Access Control (RBAC)**.

RBAC allows different users to have different permissions depending on their assigned roles.

---

# 🤖 AI Product Image Generation

Equinox OMS integrates **Pollinations AI** for dynamic product image generation.

The conceptual workflow is:

```text
Product Information
        │
        ▼
Pollinations AI
        │
        ▼
Generated Product Image
        │
        ▼
Dynamic Product Catalog
```

This allows product imagery to be generated dynamically rather than requiring every image to be manually prepared in advance.

---

# 📊 Automaton Validation

The automaton is responsible for validating every state transition.

The validation process follows:

```text
Current Order State
        │
        ▼
Requested Event
        │
        ▼
Search AutomatonRule
        │
        ▼
Is a valid rule available?
       / \
     Yes  No
      │    │
      │    ▼
      │  Reject
      │  Request
      │
      ▼
Update Order State
```

This ensures that undefined transitions cannot be performed.

---

# 🔌 Backend

The backend is implemented using **FastAPI**.

Backend URL:

```text
http://127.0.0.1:8000
```

FastAPI provides interactive API documentation through:

```text
http://127.0.0.1:8000/docs
```

and:

```text
http://127.0.0.1:8000/redoc
```

These endpoints are available when the corresponding FastAPI documentation is enabled by the application.

---

# 🎨 Frontend

The frontend is built using:

- Next.js 14
- React.js
- Tailwind CSS
- Context API
- React Hooks
- Lucide React

The frontend is responsible for:

- Product catalog
- Shopping cart
- Checkout
- Order management
- Authentication interface
- Admin dashboard
- Search
- Filtering
- Backend API communication
- Responsive UI

---

# 🧪 Example State Transitions

## Normal Order

```text
Placed
  │
  │ process
  ▼
Processing
  │
  │ ship
  ▼
Shipped
  │
  │ deliver
  ▼
Delivered
```

---

## Cancellation During Processing

```text
Placed
  │
  │ process
  ▼
Processing
  │
  │ cancel
  ▼
Cancelled
```

---

## Cancellation Before Processing

```text
Placed
  │
  │ cancel
  ▼
Cancelled
```

---

## Replacement

```text
Delivered
    │
    │ replace
    ▼
Processing
```

---

## Invalid Transition

Attempt:

```text
Delivered
    │
    │ ship
    ▼
   ❌
```

The transition is rejected because:

```text
δ(Delivered, ship)
```

is not defined.

---

# 📚 Formal Representation

The transition function can be represented as:

```text
δ(Placed, process) = Processing

δ(Placed, cancel) = Cancelled

δ(Processing, ship) = Shipped

δ(Processing, cancel) = Cancelled

δ(Shipped, deliver) = Delivered

δ(Delivered, replace) = Processing

δ(Delivered, post_deliver_cancel) = Cancelled
```

Any transition that is not explicitly defined is considered invalid.

---

# 🎓 Academic Relevance

Equinox OMS demonstrates the practical application of concepts from:

- Formal Language and Automata Theory
- Deterministic Finite Automata
- Finite State Machines
- Transition Functions
- State-Based Modeling
- Full-Stack Software Engineering

### Automata Concepts Used

**Finite Set of States**

```text
Placed
Processing
Shipped
Delivered
Cancelled
```

**Input Alphabet**

```text
process
ship
deliver
cancel
replace
post_deliver_cancel
```

**Transition Function**

```text
δ : Q × Σ → Q
```

**Initial State**

```text
Placed
```

The project demonstrates how a mathematical state-transition model can be translated into practical business logic.

---

# 🧩 Why Use a Formal State Machine?

## 1. Deterministic Behavior

For a valid state-event combination, the system produces a predictable next state.

## 2. Centralized Business Rules

Order transition rules are maintained centrally.

## 3. Invalid State Prevention

Undefined transitions are automatically rejected.

## 4. Maintainability

The lifecycle can be extended by defining additional states and events.

## 5. Formal Modeling

The complete order lifecycle can be mathematically represented.

---

# 🧪 Testing

The automata model makes it possible to systematically test order transitions.

### Valid Transitions

```text
Placed + process → Processing       ✅

Placed + cancel → Cancelled         ✅

Processing + ship → Shipped         ✅

Processing + cancel → Cancelled    ✅

Shipped + deliver → Delivered       ✅

Delivered + replace → Processing    ✅

Delivered + post_deliver_cancel
→ Cancelled                          ✅
```

### Invalid Transitions

```text
Delivered + ship                    ❌

Cancelled + process                 ❌

Cancelled + ship                    ❌

Shipped + cancel                    ❌
```

Invalid operations should be rejected by the backend.

---

# 📈 Project Highlights

| Category | Implementation |
|---|---|
| Project Type | E-Commerce Order Management System |
| Architecture | Full-Stack Web Application |
| Frontend | Next.js 14 |
| UI | React.js + Tailwind CSS |
| Backend | FastAPI |
| Database | PostgreSQL / SQLite |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Authentication | JWT |
| Authorization | RBAC |
| State Management | Formal FSM / DFA |
| Business Rules | AutomatonRule |
| AI Integration | Pollinations AI |
| Icons | Lucide React |

---

# 🔮 Future Enhancements

Potential future improvements include:

- 📦 Advanced inventory management
- 💳 Payment gateway integration
- 📧 Automated email notifications
- 📱 Improved mobile responsiveness
- 📈 Advanced analytics dashboard
- 🔍 More advanced product search
- 🧾 Automated invoice generation
- 🚚 Delivery tracking
- 📊 Order analytics
- 🤖 Additional AI-powered features
- 🔄 Expanded return and refund workflows
- 🛡️ Additional security mechanisms
- 🧪 Automated transition-rule testing
- 📐 Formal verification of larger state machines

---

# 👥 Contributors

## Gowtham

GitHub: [@jignyaz](https://github.com/jignyaz)

## Kiran Kumar

GitHub: [@KiranKumarD875](https://github.com/KiranKumarD875)

---

# 🤝 Collaboration

Contributions and improvements are welcome.

To contribute:

```bash
# Clone the repository
git clone <repository-url>

# Enter the project
cd equinox-oms

# Create a feature branch
git checkout -b feature/your-feature

# Make your changes

# Stage changes
git add .

# Commit changes
git commit -m "Add your feature"

# Push the branch
git push origin feature/your-feature
```

Then create a Pull Request on GitHub.

---

# 📄 License

This project was developed as a demonstration of integrating **Formal Language and Automata Theory (FLA)** concepts into modern full-stack web applications.

It is intended primarily for:

- Educational purposes
- Academic demonstration
- Automata theory experimentation
- Full-stack development practice
- Software engineering learning

---

# ⭐ Final Summary

**Equinox OMS** combines formal automata theory with modern full-stack development to create a deterministic order management system.

The core architecture combines:

```text
Formal Language & Automata Theory
                +
Deterministic Finite Automata
                +
Finite State Machines
                +
Next.js / React
                +
FastAPI
                +
SQLAlchemy
                +
PostgreSQL / SQLite
                +
AI Integration
```

The central principle of Equinox OMS is:

> **An order can move from one state to another only when an explicitly defined automaton transition permits that operation.**

This provides a structured and deterministic approach to managing complex e-commerce order lifecycles.

---

<p align="center">
  <strong>⚡ Equinox OMS</strong>
  <br>
  Deterministic Order Management through Formal State Machines
  <br><br>
  Built with Next.js • React • FastAPI • SQLAlchemy • PostgreSQL/SQLite
</p>
