
# 🏨 Dove Inn Hotel & Hostel Management System (ERP / PMS)

Welcome to the **Dove Inn Management System** project repository! This is an all-in-one Enterprise ERP & Property Management System (PMS) covering Hotel Operations, Hostel (PMS) Tenant Management, Restaurant POS & Kitchen Display System (KDS), Procurement & Inventory, Financial Accounting, HRM & Attendance, and Housekeeping.

---

## 📘 Comprehensive Handover Documentation for Interns & Developers

A complete, detailed technical handover document has been prepared for interns and new team members:

👉 **[HANDOVER_DOCUMENTATION.md](file:///d:/projects/dove-inn%20hotel/HANDOVER_DOCUMENTATION.md)**

### What's inside the documentation:
1. **System Overview & Capabilities**: Hotel, Hostel, POS, Inventory, Finance, HRM verticals.
2. **Architecture & Tech Stack**: React 18 (Vite + TypeScript + Tailwind CSS v4), Node.js, Express, Sequelize ORM, MySQL.
3. **Step-by-Step Local Setup**: Database creation, backend setup, frontend setup, `.env` guide.
4. **Security & Multi-Location**: JWT Auth, API Keys, `x-location-id` isolation.
5. **Database Schemas**: Complete breakdown of 65 database models and relationships.
6. **Core Workflows**: End-to-end steps for Hotel Check-in/Check-out, POS KDS order pipeline, Hostel monthly billing, and Purchasing.
7. **Frontend Routing Matrix**: Route hierarchy and access control.
8. **Gotchas & Critical Fixes**: Night-based revenue calculations, POS reservation pagination, daily ledger fee filtering.
9. **Intern First-Week Roadmap**: Step-by-step onboarding checklist.

---

## 🚀 Quick Start Commands

### 1. Database Setup
Ensure MySQL is running on port `3306` and create database `dove-inn`:
```sql
CREATE DATABASE `dove-inn` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
*Backend runs at `http://localhost:3001`*

### 3. Frontend Setup
```bash
# In the root project directory:
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`*

  