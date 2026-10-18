# Hotel Management Software (HMS) - Backend Documentation

This document provides a comprehensive overview of the Hotel Management Software backend, designed to help a professional frontend developer build a modern, high-performance interface.

---

## 1. System Architecture & Tech Stack

- **Backend Framework**: Node.js with Express.js
- **Database ORM**: Sequelize (supporting MySQL/PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens) and API Key support.
- **Multi-Location Support**: The system is designed for multiple hotel branches.
- **Key Middleware**:
    - `authMiddleware`: Protects routes; requires `Authorization: Bearer <token>`.
    - `locationMiddleware`: Identifies the branch; requires `x-location-id` header.

### Global API Configuration
- **Base URL**: `http://<domain>/api`
- **Required Headers for Protected Routes**:
    - `Authorization: Bearer <JWT_TOKEN>`
    - `x-location-id: <LOCATION_ID>` (Mandatory for branch-specific data)

---

## 2. Core Modules

### 2.1. Reservation Management (`/api/reservation`)
The heart of the HMS. Handles the lifecycle of a guest's stay.
- **Models**: `Reservation`, `ReservationRoom`, `AssignedRoom`.
- **Key Statuses**: `confirmed`, `checked-in`, `checked-out`, `cancelled`, `no-show`.
- **Key Endpoints**:
    - `POST /api/reservation`: Create a new booking.
    - `GET /api/reservation`: Fetch all reservations (filterable by date, status, location).
    - `GET /api/reservation/:id`: Detailed view of a reservation including rooms and payments.
    - `PUT /api/reservation/StatusChange`: Update status (e.g., Check-in, Check-out).
    - `POST /api/reservation/swap-room`: Move a guest to another room.

### 2.2. Room & Floor Management (`/api/rooms`, `/api/floors`, `/api/assignRoom`)
Defines the physical layout of the hotel.
- **Models**: `RoomType` (e.g., Deluxe, Suite), `Room` (categories), `AssignedRoom` (physical rooms like 101, 102), `Floor`.
- **Key Endpoints**:
    - `GET /api/floors`: List all floors in a location.
    - `GET /api/assignRoom`: Get all physical rooms and their current occupancy status.
    - `POST /api/assignRoom`: Add a new physical room.
    - `GET /api/rooms/room-types`: List available room categories.

### 2.3. Customer/Guest Management (`/api/customer`)
- **Models**: `Customer`, `UserMembership`, `MembershipPlan`.
- **Key Endpoints**:
    - `GET /api/customer`: Search and list guests.
    - `POST /api/customer`: Register a new guest.
    - `GET /api/membership`: Manage loyalty programs and membership tiers.

---

## 3. Financial Modules

### 3.1. Payments & Invoicing (`/api/payment`)
- **Models**: `Payment`, `Bank`, `BankLog`, `Journal`.
- **Key Flows**:
    - **Advance Payment**: Collected during booking.
    - **Final Settlement**: Collected during check-out.
    - **Refunds**: Handled via `StatusChange` controller logic.
- **Key Endpoints**:
    - `POST /api/payment`: Record a payment.
    - `GET /api/banks`: Manage bank accounts/cash drawers.
    - `GET /api/payment/reservation/:id`: Get all payments for a specific booking.

### 3.2. Expenses (`/api/expenses`, `/api/expense-types`)
- **Models**: `Expense`, `ExpenseType`, `Attachment`.
- **Key Endpoints**:
    - `POST /api/expenses`: Log a new expense (utility bills, maintenance, etc.).
    - `GET /api/expenses`: List and filter expenses by category or date.

---

## 4. Operations & POS

### 4.1. Sales & Extras POS (`/api/sales`, `/api/extra`)
Allows selling items (food, laundry, spa) to guests or walk-ins.
- **Models**: `Sale`, `SaleItem`, `Extra`.
- **Key Workflows**:
    - **Add to Bill**: Link a sale to a reservation room.
    - **Direct Sale**: Walk-in customer payment.

### 4.2. Kitchen Management (KDS) (`/api/kitchen`)
Real-time order tracking for the restaurant/kitchen.
- **Models**: `KitchenOrder`, `KitchenTable`.
- **Key Features**:
    - Table availability tracking.
    - Kitchen Display System (KDS) for staff to mark orders as "Prepared" or "Served".

### 4.3. Inventory & Purchasing (`/api/items`, `/api/purchase-orders`, `/api/suppliers`)
- **Models**: `Item`, `Stock`, `Supplier`, `PurchaseOrder`, `PurchaseBill`.
- **Key Workflows**:
    - **Procurement**: Supplier -> PO -> Bill -> Stock Update.
    - **Consumption**: Issuing items to housekeeping or kitchen.

---

## 5. Operations Support

### 5.1. Housekeeping (`/api/housekeeping`)
- **Features**: Assign staff to clean rooms, track "Dirty" vs "Clean" status.
- **Lost & Found**: (`/api/findloss`) Track items lost/found by guests.

### 5.2. Agents & Referrals (`/api/agent`)
- **Features**: Track bookings from Travel Agents (OTAs like Booking.com, Expedia) and manage their commissions.

### 5.3. Packages (`/api/packages`)
- **Features**: Create bundles (e.g., "Dinner + Bed + Breakfast") as a single sellable unit.

---

## 6. Administration

### 6.1. User Management & Privileges (`/api/users`)
- **Roles**: Admin, Manager, Receptionist, Housekeeping, Chef.
- **Privileges**: Granular control over which user can see/edit which module.

### 6.2. Settings & Locations (`/api/setting`, `/api/locations`)
- Global config for taxes, currency, hotel name, and branch management.

---

## 7. Reports (`/api/report`)
Extensive reporting system including:
- **Reservation Reports**: Monthly/Daily occupancy.
- **Financial Reports**: Profit & Loss, Income vs Expense.
- **Inventory Reports**: Current stock levels and depreciation.
- **Staff Reports**: Performance and tasks completed.

---

## 8. Detailed Use Cases & Workflows

To help the frontend developer understand the business logic, here are the most common use cases:

### 8.1. Walk-in Guest Check-in
**Goal**: Quickly check in a guest who arrives without a reservation.
1.  **Room Selection**: Frontend calls `GET /api/assignRoom` to find available rooms.
2.  **Registration**: Frontend calls `POST /api/customer` (if new guest).
3.  **Booking**: Frontend calls `POST /api/reservation` with `status: 'checked-in'`.
4.  **Payment**: Frontend calls `POST /api/payment` for advance payment.
5.  **Audit**: Backend automatically updates room status to 'Occupied'.

### 8.2. Group Booking Lifecycle
**Goal**: Manage multiple rooms for a single entity (e.g., a corporate group or wedding).
1.  **Group Creation**: Create a group via `/api/groups`.
2.  **Multi-Room Selection**: Select multiple rooms and link them to the `groupId`.
3.  **Unified Billing**: During checkout, the system can consolidate all room charges into a single group invoice.

### 8.3. "Extra" Service (POS) - Add to Bill
**Goal**: A guest orders food/laundry and wants to pay at checkout.
1.  **Service Selection**: Frontend lists items from `GET /api/extra`.
2.  **Transaction**: Frontend calls `POST /api/sales` with `reservationId` and `paymentMethod: 'BTC'` (Bill to Company/Room).
3.  **Update**: The amount is added to the reservation's `balanceAmount`.

### 8.4. Mid-Stay Room Swap
**Goal**: Move a guest from Room 101 to Room 105 due to a maintenance issue.
1.  **Validation**: Check availability of Room 105.
2.  **Transfer**: Call `POST /api/reservation/swap-room`.
3.  **Logic**: Backend updates `ReservationRoom` mapping and ensures billing remains continuous.

### 8.5. Checkout & Final Settlement
**Goal**: Settle all bills and release the room.
1.  **Review**: Display all room charges + extra POS sales.
2.  **Payment**: Call `POST /api/payment` for the remaining `balanceAmount`.
3.  **Status Update**: Call `PUT /api/reservation/StatusChange` with `status: 'checked-out'`.
4.  **Room Release**: Room status moves to 'Dirty', triggering a Housekeeping task.

### 8.6. Inventory Procurement
**Goal**: Re-stock items like soap, towels, or kitchen ingredients.
1.  **Purchase Order**: Create PO via `/api/purchase-orders`.
2.  **Bill Entry**: When items arrive, convert PO to a Bill via `/api/bills`.
3.  **Stock Update**: Backend automatically increments `Stock` levels for the items.

---

## 9. Professional Frontend Recommendations

To make the software look professional and premium, the designer should focus on:

### 8.1. UI Components
1.  **Dashboard Widgets**: Real-time counters for "Check-ins Today", "Available Rooms", and "Revenue".
2.  **Interactive Floor Plan**: A visual map of the hotel where rooms change color based on status (Occupied: Red, Available: Green, Dirty: Yellow).
3.  **Timeline/Calendar View**: A Gantt-chart style view for reservations to easily see room availability over time.
4.  **Quick Action Modals**: Fast check-in/check-out without leaving the main list view.
5.  **KDS Interface**: Large-tappable buttons for kitchen staff (touchscreen friendly).

### 8.2. UX Best Practices
- **Mobile Responsiveness**: Essential for housekeeping and managers on the go.
- **Global Search**: Quickly find reservations by Guest Name, Phone, or Room Number.
- **Notifications**: Sound/Visual alerts for new kitchen orders or guest requests.
- **Print Optimization**: Clean, professional templates for Invoices and Kitchen Slips.

---

*Documentation Generated for professional frontend integration.*
