# MultiMart Backend

This backend uses `Node.js + Express + MySQL` and is designed to power the existing MultiMart frontend.

## What It Covers

- auth for customer, vendor, and admin
- vendor product submission
- admin product approval
- order creation with stock reduction
- commission and vendor earning calculation
- admin and vendor dashboard overview endpoints

## Setup

1. Create the database using [schema.sql](/C:/Users/patha/Multi-Mart/backend/sql/schema.sql)
2. Copy `.env.example` to `.env`
3. Update your MySQL credentials in `.env`
4. Install packages
5. Seed starter data
6. Start the server

```bash
cd backend
npm install
npm run seed
npm run dev
```

## Suggested Build Order

1. Run the schema
2. Seed demo records if you want starter accounts
3. Connect login/register to the API
4. Move product listing to `/api/products`
5. Move checkout to `/api/orders`
6. Point admin/vendor dashboards to dashboard endpoints
