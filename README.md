# Family Finance Management System

A Next.js application for managing family finances, built with TypeScript, Tailwind CSS, and Prisma.

## Features

- User registration and login with email verification
- Dashboard displaying financial overview (income, expenses, savings, assets)
- Add income, expenses, savings, and assets
- Set spending limits with warnings
- Monthly and yearly financial summaries
- Remaining money calculation

## Getting Started

1. Set up your database:
   - Update `DATABASE_URL` in `.env` with your PostgreSQL connection string.
   - Run `npx prisma migrate dev` to apply database schema.

2. Configure email settings:
   - Update email environment variables in `.env` for Nodemailer.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`: Email configuration for Nodemailer

## Database Schema

The application uses Prisma with the following models:
- User
- Income
- Expense
- Savings
- Asset
- SpendingLimit

## API Routes

- `/api/auth/register`: User registration
- `/api/auth/login`: User login
- `/api/user/finances`: Get user's financial data
- `/api/user/summary`: Get monthly/yearly summaries
- `/api/income`: Add income
- `/api/expense`: Add expense
- `/api/saving`: Add saving
- `/api/asset`: Add asset
- `/api/spending-limit`: Set spending limit
