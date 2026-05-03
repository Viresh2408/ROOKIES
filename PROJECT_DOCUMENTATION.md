# ROOKIES - Project Overview & Documentation

Rookies is an all-in-one business management platform designed for small businesses (home bakers, kirana stores, Instagram brands, etc.) to manage inventory, track orders, and engage customers seamlessly.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16 (Turbopack)
- **Library**: React 19
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Components**: Radix UI (Headless) + Custom Tailwind Components
- **State Management**: React Hooks (useState, useMemo, useCallback)
- **Forms**: React Hook Form + Zod (Validation)

### Backend & Infrastructure
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma
- **Authentication**: Clerk (Next.js SDK)
- **API**: Next.js App Router (Server Actions & Route Handlers)
- **Client Side DB**: Supabase Client (for optimistic UI updates)

---

## 🛠️ Features Implemented

### 1. Business Dashboard
- Real-time statistics: Total Revenue, Order Count, Customer Count, and Pending Orders.
- Recent Activity Feed.
- **Integrated Leaderboard**: Top spenders and most popular inventory items are displayed directly on the dashboard.

### 2. Inventory Management
- Full CRUD (Create, Read, Update, Delete) operations for products.
- **Bulk Import**: Support for importing hundreds of items via CSV (PapaParse).
- **Optimistic UI**: Instant updates when adding or deleting items.
- Stock tracking (Unit types: kg, g, pcs, liters).
- Pricing management (Cost Price vs. Selling Price).

### 3. Order Management
- **Omni-channel Ordering**: 
    - **Owner-Direct**: Business owners can manually place orders for walk-in customers selecting directly from inventory.
    - **Customer Portal**: A dedicated link (`/customer/orders/[slug]`) for customers to browse the menu and place orders.
- **Automated Invoicing**: Generation of professional invoices with itemized breakdowns and totals.
- Status tracking: PLACED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED.

### 4. Customer Management
- Automated customer creation upon order placement.
- Detailed customer profiles with order history and total spend.
- **Ranker Board**: Analytics showing top customers by spend and frequency.

---

## 🔄 Project Workflow

### Business Owner Flow
1. **Onboarding**: Sign in via Clerk -> Create/Setup Business (Name, Slug, Brand Type).
2. **Setup**: Populate Inventory (manual or CSV import).
3. **Daily Operations**: 
    - Monitor Dashboard for new orders.
    - Place manual orders for walk-in customers.
    - Generate and share invoices.
4. **Analytics**: Check the Leaderboard on the Dashboard to see top customers.

### Customer Flow
1. **Access**: Visits the unique business link (e.g., `rookies.app/customer/orders/my-bakery`).
2. **Order**: Browses the inventory-based menu -> Adds items to cart -> Enters delivery details -> Places order.
3. **Tracking**: Receives a confirmation and can view the live status of their order.
4. **Invoice**: View/Download the invoice once the order is processed.

---

## 📊 Backend Schema (Prisma)

The project uses a relational PostgreSQL schema designed for multi-tenancy.

| Model | Description |
| :--- | :--- |
| **User** | Stores authentication data and user profiles. |
| **Business** | Core multi-tenant unit. Owns inventory, orders, and customers. |
| **BusinessMember** | Connects users to businesses with roles (Owner, Admin). |
| **InventoryItem** | Products with SKU, quantity, prices, and stock alerts. |
| **Order** | Transactional record containing customer info and JSON item list. |
| **Customer** | CRM records linked to businesses based on phone numbers. |
| **Payment** | Tracks transaction status and methods (UPI, Cash, etc.). |
| **ActivityLog** | Audit trail for business operations. |

---

## 📄 Product Requirements Document (PRD)

### **Goal**
Empower micro-merchants with enterprise-grade tools to manage sales and inventory without the complexity of traditional ERPs.

### **Functional Requirements**
- **FR1**: Users must be able to sign in and create a business profile within 60 seconds.
- **FR2**: Inventory must support bulk uploads to handle large product catalogs.
- **FR3**: The ordering system must be "Inventory-Aware" (items available for customers are pulled directly from stock).
- **FR4**: Invoices must be professional and accessible via a public URL for customer sharing.
- **FR5**: The platform must work seamlessly on mobile devices for on-the-go management.

### **Non-Functional Requirements**
- **Performance**: Dashboard metrics must load in under 1 second.
- **Scalability**: Architecture must support multiple businesses under one database.
- **Reliability**: Timestamps and ID generation must be robust to prevent data loss.

### **Success Metrics**
- Reduction in time spent manual invoicing.
- Higher customer retention via "Ranker Board" rewards.
- Zero "null-value" database errors during peak ordering.
