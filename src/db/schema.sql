-- Hospital Management System (HMS) Database Schema (SQLite)

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'doctor', 'nurse', 'receptionist', 'lab_staff', 'pharmacist', 'accountant')),
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    head_doctor_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Doctors
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    specialization TEXT NOT NULL,
    qualification TEXT,
    consultation_fee REAL DEFAULT 1500.0,
    available_days TEXT DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday',
    start_time TEXT DEFAULT '09:00 AM',
    end_time TEXT DEFAULT '05:00 PM',
    room_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Patients
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    dob DATE NOT NULL,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    blood_group TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    emergency_contact TEXT,
    allergies TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_number TEXT UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Medical Records (EMR)
CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    symptoms TEXT,
    diagnosis TEXT NOT NULL,
    treatment_plan TEXT,
    blood_pressure TEXT,
    pulse_rate TEXT,
    temperature TEXT,
    weight TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER REFERENCES medical_records(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    instructions TEXT,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Dispensed', 'Cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Prescription Items
CREATE TABLE IF NOT EXISTS prescription_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    instructions TEXT
);

-- 9. Laboratory Tests Catalog
CREATE TABLE IF NOT EXISTS lab_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_code TEXT UNIQUE NOT NULL,
    test_name TEXT NOT NULL,
    category TEXT NOT NULL,
    sample_type TEXT NOT NULL,
    cost REAL NOT NULL,
    normal_range TEXT
);

-- 10. Laboratory Requests
CREATE TABLE IF NOT EXISTS lab_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_number TEXT UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    test_id INTEGER NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Sample Collected', 'Processing', 'Completed', 'Cancelled')),
    sample_collected_at DATETIME,
    test_result TEXT,
    reference_range TEXT,
    remarks TEXT,
    performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    report_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Pharmacy Inventory
CREATE TABLE IF NOT EXISTS pharmacy_medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    generic_name TEXT,
    category TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 15,
    unit_price REAL NOT NULL,
    expiry_date DATE NOT NULL,
    supplier TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Invoices & Billing
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    consultation_charges REAL DEFAULT 0.0,
    laboratory_charges REAL DEFAULT 0.0,
    pharmacy_charges REAL DEFAULT 0.0,
    admission_charges REAL DEFAULT 0.0,
    tax REAL DEFAULT 0.0,
    discount REAL DEFAULT 0.0,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0.0,
    payment_status TEXT DEFAULT 'Unpaid' CHECK(payment_status IN ('Unpaid', 'Partially Paid', 'Paid')),
    payment_method TEXT DEFAULT 'Cash' CHECK(payment_method IN ('Cash', 'Card', 'Insurance', 'Bank Transfer')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    total REAL NOT NULL
);

-- 14. Employees (Staff Management)
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    designation TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    join_date DATE,
    salary REAL DEFAULT 0.0,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'On Leave', 'Resigned')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Staff Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TEXT,
    check_out_time TEXT,
    status TEXT DEFAULT 'Present' CHECK(status IN ('Present', 'Absent', 'Half Day', 'Late')),
    UNIQUE(employee_id, date)
);

-- 16. Staff Leaves
CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK(leave_type IN ('Sick', 'Casual', 'Annual', 'Maternity', 'Emergency')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
