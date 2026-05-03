# Customer Portal - Setup Guide

## Overview

A separate customer-facing portal has been created for customers to:
1. Browse businesses
2. Place orders
3. Track delivery status

## Routes

### Customer Pages

| Route | Purpose |
|-------|---------|
| `/customer` | Home page with search and features overview |
| `/customer/auth/sign-in` | Customer login (email/phone) |
| `/customer/orders` | Browse all active businesses |
| `/customer/orders/[businessId]` | Place order for specific business |
| `/customer/orders/[businessId]/confirmation/[orderId]` | Order confirmation page |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/customer/auth/email` | POST | Email-based authentication |
| `/api/customer/auth/phone` | POST | Phone-based authentication (OTP) |
| `/api/customer/businesses` | GET | List all active businesses |
| `/api/customer/businesses/[businessId]` | GET | Get specific business details |
| `/api/customer/orders` | POST | Create a new order |

## Features

### 1. **Business Directory**
- Customers can search/filter businesses by name or location
- View business details (name, type, address, phone)
- Browse multiple businesses

### 2. **Order Placement**
- Add items with name and price
- Adjust quantities
- Add customer details (name, phone, email, address)
- Set delivery time and special instructions
- Real-time order summary with total

### 3. **Authentication** (Currently Basic)
- Email login (ready for OTP integration with Resend)
- Phone login (ready for OTP integration with Twilio)

## Next Steps

### 1. **Authentication Enhancement**
To enable actual email/SMS OTP:

```typescript
// Install Resend for emails
npm install resend

// Install Twilio for SMS
npm install twilio

// Update API routes:
// - app/api/customer/auth/email/route.ts
// - app/api/customer/auth/phone/route.ts
```

### 2. **Database Integration**
The system automatically:
- Creates/updates customers when placing orders
- Stores orders with all details
- Links customers to businesses

No schema changes needed - uses existing `Customer` and `Order` models.

### 3. **Order Tracking**
Create a tracking page where customers can view:
- Order status
- Estimated delivery time
- OTP for verification

### 4. **Menu Management**
Add a menu/catalog system where businesses can:
- Manage items
- Set prices
- Create categories

Example schema addition:
```prisma
model MenuItem {
  id        String   @id @default(uuid())
  businessId String  @map("business_id")
  name      String
  price     Decimal  @db.Decimal(10, 2)
  category  String?
  image     String?
  
  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
}
```

## Testing

1. **Start development server:**
```bash
npm run dev
```

2. **Access customer portal:**
- Home: http://localhost:3000/customer
- Browse orders: http://localhost:3000/customer/orders
- Sign in: http://localhost:3000/customer/auth/sign-in

3. **Create a test business:**
Using the business dashboard, create a business with:
- Name: "Test Bakery"
- Type: "home_baker"
- Address: "123 Main St"
- Phone: "+91-98765-43210"

4. **Place a test order:**
- Go to `/customer/orders`
- Click "Place Order" on test business
- Add items and fill in details
- Submit

## Current Status

✅ **Complete:**
- Customer portal structure
- Business directory and search
- Order form with item management
- Order confirmation page
- API endpoints

⏳ **Ready to implement:**
- Email OTP (requires Resend integration)
- SMS OTP (requires Twilio integration)
- Order tracking page
- Menu/catalog management
- Payment integration

## File Structure

```
app/
├── (customer)/
│   ├── layout.tsx                    # Customer layout
│   ├── page.tsx                      # Home page
│   ├── auth/
│   │   ├── layout.tsx
│   │   └── sign-in/
│   │       └── page.tsx
│   └── orders/
│       ├── page.tsx                  # Browse businesses
│       ├── [businessId]/
│       │   ├── page.tsx              # Place order
│       │   └── confirmation/
│       │       └── [orderId]/
│       │           └── page.tsx      # Order confirmation
│
└── api/
    └── customer/
        ├── auth/
        │   ├── email/route.ts
        │   └── phone/route.ts
        ├── businesses/
        │   ├── route.ts              # List businesses
        │   └── [businessId]/route.ts # Get business
        └── orders/route.ts           # Create order
```

## Environment Variables

No additional environment variables needed for the customer portal.
Uses existing database and API configurations.

---

For questions or issues, check the main README.md or docs/ folder.
