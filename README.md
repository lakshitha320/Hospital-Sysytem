# Hospital Management System (HMS)

An enterprise-grade, full-stack Hospital Management System built strictly according to the **Software Specification Document**.

---

## 🌟 Key Features & Functional Modules

1. **User Management & RBAC**:
   - 7 Core Roles: **Administrator**, **Doctor**, **Nurse**, **Receptionist**, **Laboratory Staff**, **Pharmacist**, and **Accountant**.
   - JWT authentication with secure password hashing (`bcryptjs`).
   - Dynamic role-based permissions and interface adaptation.

2. **Electronic Medical Records (EMR) & Clinical Consultation**:
   - Patient chief complaints, symptoms, diagnoses, and treatment plans.
   - Comprehensive vitals tracking (BP, pulse, temp, weight).
   - Electronic prescription generation linked to pharmacy dispensing.

3. **Patient Management**:
   - Patient registration with automatic ID generation (`PAT-100X`).
   - Search by code, full name, phone number, and email.
   - Patient medical history drawer with previous visits, lab results, and invoices.

4. **Doctor & Schedule Directory**:
   - Doctors catalog with department assignments, consultation fees, duty days/hours, and room numbers.

5. **Appointment Scheduling**:
   - Appointment booking with doctor selection and date/time slots.
   - Real-time status pipeline (`Scheduled` ➔ `In Progress` ➔ `Completed` ➔ `Cancelled`).
   - Date and department filtering.

6. **Laboratory Management**:
   - Diagnostics test catalog (Hematology, Biochemistry, Microbiology, Radiology).
   - Test order tracking: `Pending` ➔ `Sample Collected` ➔ `Result Recorded` ➔ `Completed`.
   - **Printable official diagnostic report** with hospital letterhead and technologist signature.

7. **Pharmacy & Inventory Control**:
   - Drug inventory tracking with batch numbers, stock levels, and unit prices.
   - Automatic warnings for **Low Stock** and **Near-Expiry** (< 60 days).
   - Prescription dispensing queue for incoming doctor prescriptions.

8. **Billing & Invoicing System**:
   - Itemized charge aggregation (Doctor Consultation + Lab Tests + Pharmacy Medicines + Room/Admission).
   - Automated discount & tax calculations.
   - Payment status tracking (`Paid`, `Partially Paid`, `Unpaid`).
   - **Printable patient tax invoice and receipt** with hospital letterhead and breakdown.

9. **Staff Management & HR**:
   - Employee directory with designations, roles, salaries, and join dates.
   - Daily attendance recording (Check-in, check-out, Present, Late, Absent).
   - Leave applications and admin approvals.

10. **Reports & Analytics Dashboard**:
    - Live operational metrics (Total Patients, Today's Appointments, Revenue Collected, Lab Requests, Pharmacy Alerts).
    - Analytical breakdown by department, appointment volume, and patient demographics.

---

## 🔑 Demo User Accounts (Password: `password123`)

| Role | Username | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `password123` | Full access across all modules, staff & settings |
| **Doctor** | `doctor` | `password123` | EMR, diagnoses, e-prescriptions, clinical visits |
| **Nurse** | `nurse` | `password123` | Patient vitals, appointment support, sample assist |
| **Receptionist** | `receptionist`| `password123` | Patient registration, appointment bookings |
| **Laboratory Staff** | `lab_staff` | `password123` | Sample collection, result entry, lab reports |
| **Pharmacist** | `pharmacist` | `password123` | Drug stock, expiry monitoring, dispensing |
| **Accountant** | `accountant` | `password123` | Invoicing, payments, receipts, revenue analytics |

> 💡 **Tip**: In the application header and login screen, you can also switch between any role with **1-click** to test all permission levels instantly!

---

## 🚀 Running the System

### 1. Backend Server
```bash
cd backend
npm start
# API runs on: http://localhost:5000
```

### 2. Frontend Application
```bash
cd frontend
npm run dev
# Frontend runs on: http://localhost:3000
```
