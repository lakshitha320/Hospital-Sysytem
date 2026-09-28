const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

let dbPath;
if (isVercel) {
  dbPath = path.join('/tmp', 'hms.db');
  console.log('Running on Vercel Serverless. SQLite path:', dbPath);
} else {
  dbPath = path.resolve(__dirname, '../../hms.db');
}

const schemaPath = path.resolve(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initDatabase();
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

async function initDatabase() {
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql, async (err) => {
      if (err) {
        console.error('Failed to initialize database schema:', err.message);
      } else {
        console.log('HMS Database schema initialized.');
        await checkAndSeedData();
      }
    });
  } catch (err) {
    console.error('Error reading schema file:', err);
  }
}

async function checkAndSeedData() {
  db.get('SELECT COUNT(*) as count FROM users', [], async (err, row) => {
    if (err || !row || row.count === 0) {
      console.log('No users found. Auto-seeding initial HMS data...');
      try {
        await seedData();
      } catch (seedErr) {
        console.error('Auto-seed error:', seedErr);
      }
    } else {
      console.log(`Database already populated with ${row.count} users.`);
    }
  });
}

async function seedData() {
  const salt = await bcrypt.genSalt(10);
  const defaultHash = await bcrypt.hash('password123', salt);

  const runQ = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  // 1. Users
  const users = [
    { username: 'admin', password: defaultHash, full_name: 'Dr. Arthur Pendelton', role: 'admin', email: 'admin@hms.hospital', phone: '0771234560' },
    { username: 'doctor', password: defaultHash, full_name: 'Dr. Priyantha Silva', role: 'doctor', email: 'dr.priyantha@hms.hospital', phone: '0771234561' },
    { username: 'doctor2', password: defaultHash, full_name: 'Dr. Sarah Senanayake', role: 'doctor', email: 'dr.sarah@hms.hospital', phone: '0771234562' },
    { username: 'nurse', password: defaultHash, full_name: 'Nurse Chamari Fernando', role: 'nurse', email: 'chamari@hms.hospital', phone: '0771234563' },
    { username: 'receptionist', password: defaultHash, full_name: 'Kavindu Bandara', role: 'receptionist', email: 'reception@hms.hospital', phone: '0771234564' },
    { username: 'lab_staff', password: defaultHash, full_name: 'Nuwan Perera (Lab Tech)', role: 'lab_staff', email: 'lab@hms.hospital', phone: '0771234565' },
    { username: 'pharmacist', password: defaultHash, full_name: 'Anoma Wickramasinghe (B.Pharm)', role: 'pharmacist', email: 'pharmacy@hms.hospital', phone: '0771234566' },
    { username: 'accountant', password: defaultHash, full_name: 'Dinesh Jayasuriya (CMA)', role: 'accountant', email: 'accounts@hms.hospital', phone: '0771234567' }
  ];

  for (const u of users) {
    await runQ(
      `INSERT OR IGNORE INTO users (username, password_hash, full_name, role, email, phone) VALUES (?, ?, ?, ?, ?, ?)`,
      [u.username, u.password, u.full_name, u.role, u.email, u.phone]
    );
  }

  // 2. Departments
  const departments = [
    { name: 'General Medicine', description: 'Primary healthcare and diagnostic examinations', head: 'Dr. Priyantha Silva' },
    { name: 'Cardiology', description: 'Heart and cardiovascular care', head: 'Dr. Sarah Senanayake' },
    { name: 'Pediatrics', description: 'Infant, child, and adolescent medical care', head: 'Dr. M. De Alwis' },
    { name: 'Orthopedics', description: 'Bones, joints, and musculoskeletal system', head: 'Dr. K. Jayatillake' },
    { name: 'Dermatology', description: 'Skin, hair, and cosmetic treatments', head: 'Dr. R. Fonseka' }
  ];
  for (const d of departments) {
    await runQ(`INSERT OR IGNORE INTO departments (name, description, head_doctor_name) VALUES (?, ?, ?)`, [d.name, d.description, d.head]);
  }

  // 3. Doctors
  await runQ(
    `INSERT OR IGNORE INTO doctors (user_id, department_id, specialization, qualification, consultation_fee, available_days, start_time, end_time, room_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [2, 1, 'Consultant Physician', 'MBBS, MD (Medicine), MRCP (UK)', 2500.0, 'Monday,Wednesday,Friday', '08:30 AM', '01:30 PM', 'Room 101']
  );
  await runQ(
    `INSERT OR IGNORE INTO doctors (user_id, department_id, specialization, qualification, consultation_fee, available_days, start_time, end_time, room_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [3, 2, 'Consultant Cardiologist', 'MBBS, MD, FRCP, FACC', 3500.0, 'Tuesday,Thursday,Saturday', '02:00 PM', '07:00 PM', 'Room 205']
  );

  // 4. Patients
  const patients = [
    { code: 'PAT-1001', name: 'Sunil Weerasinghe', dob: '1984-05-14', gender: 'Male', blood: 'O+', phone: '0714589210', email: 'sunil.w@gmail.com', address: 'No 45, Temple Road, Colombo 03', emergency: '0718889900 (Wife)', allergies: 'Penicillin' },
    { code: 'PAT-1002', name: 'Malkanthi Rathnayake', dob: '1992-11-20', gender: 'Female', blood: 'A+', phone: '0773344556', email: 'malkanthi@gmail.com', address: 'No 12, Galle Road, Dehiwala', emergency: '0772211445 (Husband)', allergies: 'Sulfa Drugs' },
    { code: 'PAT-1003', name: 'Mohamed Rizwan', dob: '1978-03-08', gender: 'Male', blood: 'B+', phone: '0761239874', email: 'rizwan.m@yahoo.com', address: '88/2 Kandy Road, Kiribathgoda', emergency: '0769991122 (Brother)', allergies: 'None' },
    { code: 'PAT-1004', name: 'Nisansala Kumari', dob: '2001-08-25', gender: 'Female', blood: 'AB+', phone: '0703322114', email: 'nisansala.k@gmail.com', address: '14 Station Road, Maharagama', emergency: '0708877665 (Father)', allergies: 'Aspirin' }
  ];
  for (const p of patients) {
    await runQ(
      `INSERT OR IGNORE INTO patients (patient_code, full_name, dob, gender, blood_group, phone, email, address, emergency_contact, allergies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.code, p.name, p.dob, p.gender, p.blood, p.phone, p.email, p.address, p.emergency, p.allergies]
    );
  }

  // 5. Appointments
  const today = new Date().toISOString().split('T')[0];
  const appointments = [
    { num: 'APT-2026-001', pid: 1, did: 1, deptId: 1, date: today, time: '09:00 AM', status: 'Completed', notes: 'Routine checkup and blood pressure monitoring' },
    { num: 'APT-2026-002', pid: 2, did: 2, deptId: 2, date: today, time: '02:30 PM', status: 'Scheduled', notes: 'Chest tightness and shortness of breath' },
    { num: 'APT-2026-003', pid: 3, did: 1, deptId: 1, date: today, time: '11:00 AM', status: 'In Progress', notes: 'Fever, cough, and throat irritation for 3 days' },
    { num: 'APT-2026-004', pid: 4, did: 2, deptId: 2, date: today, time: '04:00 PM', status: 'Scheduled', notes: 'ECG review and follow-up' }
  ];
  for (const a of appointments) {
    await runQ(
      `INSERT OR IGNORE INTO appointments (appointment_number, patient_id, doctor_id, department_id, appointment_date, appointment_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.num, a.pid, a.did, a.deptId, a.date, a.time, a.status, a.notes]
    );
  }

  // 6. EMR Record & Prescriptions
  await runQ(
    `INSERT OR IGNORE INTO medical_records (id, patient_id, doctor_id, appointment_id, symptoms, diagnosis, treatment_plan, blood_pressure, pulse_rate, temperature, weight, notes)
     VALUES (1, 1, 1, 1, 'Mild headache, elevated blood pressure during home checks', 'Stage 1 Essential Hypertension', 'Lifestyle modifications, reduce salt intake, Losartan potassium 50mg daily', '142/90 mmHg', '78 bpm', '98.4 F', '74 kg', 'Patient advised to return for a follow-up visit.')`
  );
  await runQ(
    `INSERT OR IGNORE INTO prescriptions (id, record_id, patient_id, doctor_id, instructions, status)
     VALUES (1, 1, 1, 1, 'Take medication after meals regularly. Drink plenty of water.', 'Pending')`
  );
  await runQ(
    `INSERT OR IGNORE INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, quantity, instructions)
     VALUES (1, 'Losartan Potassium', '50mg', 'Once daily in the morning', '30 days', 30, 'Take after breakfast')`
  );

  // 7. Lab Tests Catalog
  const labTests = [
    { code: 'LAB-FBC', name: 'Full Blood Count (FBC / CBC)', cat: 'Hematology', sample: 'Whole Blood (EDTA)', cost: 1200.0, range: 'Hb: 12-16 g/dL, WBC: 4000-11000 /uL' },
    { code: 'LAB-FBS', name: 'Fasting Blood Sugar (FBS)', cat: 'Biochemistry', sample: 'Fluoride Plasma', cost: 650.0, range: '70 - 100 mg/dL' },
    { code: 'LAB-LIPID', name: 'Lipid Profile', cat: 'Biochemistry', sample: 'Serum', cost: 2200.0, range: 'Total Cholesterol < 200, Triglycerides < 150 mg/dL' },
    { code: 'LAB-ECG', name: 'Electrocardiogram (ECG 12-lead)', cat: 'Cardiology', sample: 'Surface Electrodes', cost: 1500.0, range: 'Normal Sinus Rhythm' }
  ];
  for (const t of labTests) {
    await runQ(`INSERT OR IGNORE INTO lab_tests (test_code, test_name, category, sample_type, cost, normal_range) VALUES (?, ?, ?, ?, ?, ?)`, [t.code, t.name, t.cat, t.sample, t.cost, t.range]);
  }

  // 8. Pharmacy Medicines
  const medicines = [
    { code: 'MED-001', name: 'Amoxicillin 500mg', generic: 'Amoxicillin Trihydrate', cat: 'Antibiotics', batch: 'AMX-2025-08', stock: 150, min: 25, price: 18.50, expiry: '2027-05-30', supplier: 'State Pharmaceuticals Corp' },
    { code: 'MED-002', name: 'Paracetamol 500mg', generic: 'Acetaminophen', cat: 'Analgesics', batch: 'PCM-2026-01', stock: 600, min: 100, price: 5.00, expiry: '2028-01-15', supplier: 'GlaxoSmithKline SL' },
    { code: 'MED-003', name: 'Losartan Potassium 50mg', generic: 'Losartan', cat: 'Cardiovascular', batch: 'LOS-2025-11', stock: 240, min: 50, price: 24.00, expiry: '2027-09-10', supplier: 'Cipla Lanka' },
    { code: 'MED-006', name: 'Cetirizine 10mg', generic: 'Cetirizine HCl', cat: 'Antihistamines', batch: 'CTZ-2025-01', stock: 8, min: 20, price: 8.00, expiry: '2026-10-30', supplier: 'Emerchemie SL' }
  ];
  for (const m of medicines) {
    await runQ(
      `INSERT OR IGNORE INTO pharmacy_medicines (medicine_code, name, generic_name, category, batch_number, stock_quantity, min_stock_level, unit_price, expiry_date, supplier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.code, m.name, m.generic, m.cat, m.batch, m.stock, m.min, m.price, m.expiry, m.supplier]
    );
  }

  // 9. Invoices
  await runQ(
    `INSERT OR IGNORE INTO invoices (id, invoice_number, patient_id, appointment_id, consultation_charges, laboratory_charges, pharmacy_charges, admission_charges, tax, discount, total_amount, paid_amount, payment_status, payment_method, created_by, notes)
     VALUES (1, 'INV-2026-0001', 1, 1, 2500.0, 2200.0, 1680.0, 0.0, 0.0, 150.0, 6230.0, 6230.0, 'Paid', 'Card', 8, 'Full settlement paid via VISA credit card.')`
  );
  await runQ(
    `INSERT OR IGNORE INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, total)
     VALUES (1, 'Consultation', 'Consultant Physician Visit - Dr. Priyantha Silva', 1, 2500.0, 2500.0)`
  );

  // 10. Employees
  const employees = [
    { code: 'EMP-001', userId: 1, name: 'Dr. Arthur Pendelton', role: 'admin', deptId: 1, desig: 'Medical Director / Hospital Administrator', phone: '0771234560', email: 'admin@hms.hospital', join: '2018-01-10', salary: 350000.0 },
    { code: 'EMP-002', userId: 2, name: 'Dr. Priyantha Silva', role: 'doctor', deptId: 1, desig: 'Senior Consultant Physician', phone: '0771234561', email: 'dr.priyantha@hms.hospital', join: '2019-03-15', salary: 300000.0 },
    { code: 'EMP-004', userId: 4, name: 'Chamari Fernando', role: 'nurse', deptId: 1, desig: 'Head Nurse - OPD', phone: '0771234563', email: 'chamari@hms.hospital', join: '2021-02-01', salary: 95000.0 },
    { code: 'EMP-005', userId: 5, name: 'Kavindu Bandara', role: 'receptionist', deptId: 1, desig: 'Front Office Receptionist', phone: '0771234564', email: 'reception@hms.hospital', join: '2022-05-10', salary: 65000.0 },
    { code: 'EMP-006', userId: 6, name: 'Nuwan Perera', role: 'lab_staff', deptId: 1, desig: 'Senior Medical Laboratory Technologist', phone: '0771234565', email: 'lab@hms.hospital', join: '2020-11-20', salary: 110000.0 },
    { code: 'EMP-007', userId: 7, name: 'Anoma Wickramasinghe', role: 'pharmacist', deptId: 1, desig: 'Chief Pharmacist', phone: '0771234566', email: 'pharmacy@hms.hospital', join: '2019-09-01', salary: 125000.0 },
    { code: 'EMP-008', userId: 8, name: 'Dinesh Jayasuriya', role: 'accountant', deptId: 1, desig: 'Senior Financial Accountant', phone: '0771234567', email: 'accounts@hms.hospital', join: '2020-04-15', salary: 135000.0 }
  ];
  for (const e of employees) {
    await runQ(
      `INSERT OR IGNORE INTO employees (employee_code, user_id, full_name, role, department_id, designation, phone, email, join_date, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.code, e.userId, e.name, e.role, e.deptId, e.desig, e.phone, e.email, e.join, e.salary]
    );
  }

  console.log('--- Database Seeding Complete & Ready ---');
}

// Promisified helpers
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise(function(resolve, reject) {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  query,
  get,
  run
};
