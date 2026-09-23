const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../hms.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath);

async function seed() {
  console.log('--- Starting HMS Database Seeding ---');

  // Apply schema first
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await new Promise((resolve, reject) => {
    db.exec(schemaSql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const salt = await bcrypt.genSalt(10);
  const defaultHash = await bcrypt.hash('password123', salt);

  const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  // Check if users exist
  const existingUsers = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });

  if (existingUsers > 0) {
    console.log('Database already contains data. Skipping re-seed.');
    db.close();
    return;
  }

  // 1. Insert Users for all 7 roles
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
    await runQuery(
      `INSERT INTO users (username, password_hash, full_name, role, email, phone) VALUES (?, ?, ?, ?, ?, ?)`,
      [u.username, u.password, u.full_name, u.role, u.email, u.phone]
    );
  }
  console.log('Seeded Users for all 7 Roles.');

  // 2. Departments
  const departments = [
    { name: 'General Medicine', description: 'Primary healthcare and diagnostic examinations', head: 'Dr. Priyantha Silva' },
    { name: 'Cardiology', description: 'Heart and cardiovascular care', head: 'Dr. Sarah Senanayake' },
    { name: 'Pediatrics', description: 'Infant, child, and adolescent medical care', head: 'Dr. M. De Alwis' },
    { name: 'Orthopedics', description: 'Bones, joints, and musculoskeletal system', head: 'Dr. K. Jayatillake' },
    { name: 'Dermatology', description: 'Skin, hair, and cosmetic treatments', head: 'Dr. R. Fonseka' }
  ];

  for (const d of departments) {
    await runQuery(`INSERT INTO departments (name, description, head_doctor_name) VALUES (?, ?, ?)`, [d.name, d.description, d.head]);
  }
  console.log('Seeded Departments.');

  // 3. Doctors
  await runQuery(
    `INSERT INTO doctors (user_id, department_id, specialization, qualification, consultation_fee, available_days, start_time, end_time, room_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [2, 1, 'Consultant Physician', 'MBBS, MD (Medicine), MRCP (UK)', 2500.0, 'Monday,Wednesday,Friday', '08:30 AM', '01:30 PM', 'Room 101']
  );

  await runQuery(
    `INSERT INTO doctors (user_id, department_id, specialization, qualification, consultation_fee, available_days, start_time, end_time, room_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [3, 2, 'Consultant Cardiologist', 'MBBS, MD, FRCP, FACC', 3500.0, 'Tuesday,Thursday,Saturday', '02:00 PM', '07:00 PM', 'Room 205']
  );
  console.log('Seeded Doctors.');

  // 4. Patients
  const patients = [
    { code: 'PAT-1001', name: 'Sunil Weerasinghe', dob: '1984-05-14', gender: 'Male', blood: 'O+', phone: '0714589210', email: 'sunil.w@gmail.com', address: 'No 45, Temple Road, Colombo 03', emergency: '0718889900 (Wife)', allergies: 'Penicillin' },
    { code: 'PAT-1002', name: 'Malkanthi Rathnayake', dob: '1992-11-20', gender: 'Female', blood: 'A+', phone: '0773344556', email: 'malkanthi@gmail.com', address: 'No 12, Galle Road, Dehiwala', emergency: '0772211445 (Husband)', allergies: 'Sulfa Drugs' },
    { code: 'PAT-1003', name: 'Mohamed Rizwan', dob: '1978-03-08', gender: 'Male', blood: 'B+', phone: '0761239874', email: 'rizwan.m@yahoo.com', address: '88/2 Kandy Road, Kiribathgoda', emergency: '0769991122 (Brother)', allergies: 'None' },
    { code: 'PAT-1004', name: 'Nisansala Kumari', dob: '2001-08-25', gender: 'Female', blood: 'AB+', phone: '0703322114', email: 'nisansala.k@gmail.com', address: '14 Station Road, Maharagama', emergency: '0708877665 (Father)', allergies: 'Aspirin' }
  ];

  for (const p of patients) {
    await runQuery(
      `INSERT INTO patients (patient_code, full_name, dob, gender, blood_group, phone, email, address, emergency_contact, allergies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.code, p.name, p.dob, p.gender, p.blood, p.phone, p.email, p.address, p.emergency, p.allergies]
    );
  }
  console.log('Seeded Patients.');

  // 5. Appointments
  const today = new Date().toISOString().split('T')[0];
  const appointments = [
    { num: 'APT-2026-001', pid: 1, did: 1, deptId: 1, date: today, time: '09:00 AM', status: 'Completed', notes: 'Routine checkup and blood pressure monitoring' },
    { num: 'APT-2026-002', pid: 2, did: 2, deptId: 2, date: today, time: '02:30 PM', status: 'Scheduled', notes: 'Chest tightness and shortness of breath' },
    { num: 'APT-2026-003', pid: 3, did: 1, deptId: 1, date: today, time: '11:00 AM', status: 'In Progress', notes: 'Fever, cough, and throat irritation for 3 days' },
    { num: 'APT-2026-004', pid: 4, did: 2, deptId: 2, date: today, time: '04:00 PM', status: 'Scheduled', notes: 'ECG review and follow-up' }
  ];

  for (const a of appointments) {
    await runQuery(
      `INSERT INTO appointments (appointment_number, patient_id, doctor_id, department_id, appointment_date, appointment_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.num, a.pid, a.did, a.deptId, a.date, a.time, a.status, a.notes]
    );
  }
  console.log('Seeded Appointments.');

  // 6. Medical Records (EMR)
  await runQuery(
    `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, symptoms, diagnosis, treatment_plan, blood_pressure, pulse_rate, temperature, weight, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      1,
      1,
      1,
      'Mild headache, elevated blood pressure during home checks',
      'Stage 1 Essential Hypertension',
      'Lifestyle modifications, reduce salt intake, Losartan potassium 50mg daily',
      '142/90 mmHg',
      '78 bpm',
      '98.4 F',
      '74 kg',
      'Patient advised to return for a follow-up visit in 4 weeks with a blood pressure chart.'
    ]
  );
  console.log('Seeded EMR Medical Record.');

  // 7. Prescriptions & Items
  const presRes = await runQuery(
    `INSERT INTO prescriptions (record_id, patient_id, doctor_id, instructions, status)
     VALUES (?, ?, ?, ?, ?)`,
    [1, 1, 1, 'Take medication after meals regularly. Drink plenty of water.', 'Pending']
  );
  const presId = presRes.lastID;

  await runQuery(
    `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, quantity, instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [presId, 'Losartan Potassium', '50mg', 'Once daily in the morning', '30 days', 30, 'Take after breakfast']
  );
  await runQuery(
    `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, quantity, instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [presId, 'Atorvastatin', '10mg', 'Once daily at bedtime', '30 days', 30, 'Take before sleeping']
  );
  console.log('Seeded Prescriptions.');

  // 8. Laboratory Tests Catalog
  const labTests = [
    { code: 'LAB-FBC', name: 'Full Blood Count (FBC / CBC)', cat: 'Hematology', sample: 'Whole Blood (EDTA)', cost: 1200.0, range: 'Hb: 12-16 g/dL, WBC: 4000-11000 /uL, Plt: 150k-450k /uL' },
    { code: 'LAB-FBS', name: 'Fasting Blood Sugar (FBS)', cat: 'Biochemistry', sample: 'Fluoride Plasma', cost: 650.0, range: '70 - 100 mg/dL' },
    { code: 'LAB-LIPID', name: 'Lipid Profile', cat: 'Biochemistry', sample: 'Serum', cost: 2200.0, range: 'Cholesterol < 200, Triglycerides < 150, HDL > 40, LDL < 100 mg/dL' },
    { code: 'LAB-LFT', name: 'Liver Function Test (LFT)', cat: 'Biochemistry', sample: 'Serum', cost: 2500.0, range: 'SGOT: 10-40 U/L, SGPT: 7-56 U/L, Bilirubin: 0.2-1.2 mg/dL' },
    { code: 'LAB-UFR', name: 'Urine Full Report (UFR)', cat: 'Microbiology', sample: 'Midstream Urine', cost: 600.0, range: 'Pus cells: 0-3, Red cells: Nil, Albumin: Nil' },
    { code: 'LAB-ECG', name: 'Electrocardiogram (ECG 12-lead)', cat: 'Cardiology', sample: 'Surface Electrodes', cost: 1500.0, range: 'Normal Sinus Rhythm' }
  ];

  for (const t of labTests) {
    await runQuery(
      `INSERT INTO lab_tests (test_code, test_name, category, sample_type, cost, normal_range) VALUES (?, ?, ?, ?, ?, ?)`,
      [t.code, t.name, t.cat, t.sample, t.cost, t.range]
    );
  }
  console.log('Seeded Laboratory Tests.');

  // 9. Laboratory Requests
  await runQuery(
    `INSERT INTO lab_requests (request_number, patient_id, doctor_id, test_id, status, sample_collected_at, test_result, reference_range, remarks, performed_by, report_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'LRQ-2026-001',
      1,
      1,
      3, // Lipid profile
      'Completed',
      '2026-09-22 09:30:00',
      'Total Cholesterol: 215 mg/dL (Borderline High)\nTriglycerides: 140 mg/dL\nHDL: 42 mg/dL\nLDL: 145 mg/dL',
      'Total Chol: <200, LDL: <100',
      'Mild hyperlipidemia noted. Follow dietary adjustments.',
      6, // Nuwan Perera (Lab Tech)
      '2026-09-22 14:00:00'
    ]
  );

  await runQuery(
    `INSERT INTO lab_requests (request_number, patient_id, doctor_id, test_id, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'LRQ-2026-002',
      2,
      2,
      6, // ECG
      'Sample Collected'
    ]
  );
  console.log('Seeded Laboratory Requests.');

  // 10. Pharmacy Medicines
  const medicines = [
    { code: 'MED-001', name: 'Amoxicillin 500mg', generic: 'Amoxicillin Trihydrate', cat: 'Antibiotics', batch: 'AMX-2025-08', stock: 150, min: 25, price: 18.50, expiry: '2027-05-30', supplier: 'State Pharmaceuticals Corp' },
    { code: 'MED-002', name: 'Paracetamol 500mg', generic: 'Acetaminophen', cat: 'Analgesics', batch: 'PCM-2026-01', stock: 600, min: 100, price: 5.00, expiry: '2028-01-15', supplier: 'GlaxoSmithKline SL' },
    { code: 'MED-003', name: 'Losartan Potassium 50mg', generic: 'Losartan', cat: 'Cardiovascular', batch: 'LOS-2025-11', stock: 240, min: 50, price: 24.00, expiry: '2027-09-10', supplier: 'Cipla Lanka' },
    { code: 'MED-004', name: 'Atorvastatin 10mg', generic: 'Atorvastatin Calcium', cat: 'Cardiovascular', batch: 'ATV-2025-03', stock: 180, min: 40, price: 32.00, expiry: '2027-08-20', supplier: 'Sun Pharma' },
    { code: 'MED-005', name: 'Omeprazole 20mg', generic: 'Omeprazole Capsules', cat: 'Gastrointestinal', batch: 'OMP-2026-04', stock: 320, min: 50, price: 15.00, expiry: '2027-12-31', supplier: 'Astron Ltd' },
    { code: 'MED-006', name: 'Cetirizine 10mg', generic: 'Cetirizine HCl', cat: 'Antihistamines', batch: 'CTZ-2025-01', stock: 8, min: 20, price: 8.00, expiry: '2026-10-30', supplier: 'Emerchemie SL' }, // Low stock & expiring soon for alerts!
    { code: 'MED-007', name: 'Insulin Glargine 100 IU/ml', generic: 'Insulin Glargine', cat: 'Endocrine', batch: 'INS-2025-09', stock: 5, min: 15, price: 2150.00, expiry: '2026-11-15', supplier: 'Sanofi Lanka' } // Low stock & expiring soon
  ];

  for (const m of medicines) {
    await runQuery(
      `INSERT INTO pharmacy_medicines (medicine_code, name, generic_name, category, batch_number, stock_quantity, min_stock_level, unit_price, expiry_date, supplier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.code, m.name, m.generic, m.cat, m.batch, m.stock, m.min, m.price, m.expiry, m.supplier]
    );
  }
  console.log('Seeded Pharmacy Medicines.');

  // 11. Invoices & Billing
  const invRes = await runQuery(
    `INSERT INTO invoices (invoice_number, patient_id, appointment_id, consultation_charges, laboratory_charges, pharmacy_charges, admission_charges, tax, discount, total_amount, paid_amount, payment_status, payment_method, created_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'INV-2026-0001',
      1,
      1,
      2500.0, // Doctor consultation
      2200.0, // Lipid profile
      1680.0, // Medicines (Losartan + Atorvastatin)
      0.0,
      0.0,
      150.0, // Discount
      6230.0,
      6230.0,
      'Paid',
      'Card',
      8, // Dinesh (Accountant)
      'Full settlement paid via VISA credit card.'
    ]
  );
  const invId = invRes.lastID;

  await runQuery(
    `INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, total)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [invId, 'Consultation', 'Consultant Physician Visit - Dr. Priyantha Silva', 1, 2500.0, 2500.0]
  );
  await runQuery(
    `INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, total)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [invId, 'Lab Test', 'Lipid Profile Lab Panel', 1, 2200.0, 2200.0]
  );
  await runQuery(
    `INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, total)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [invId, 'Medicine', 'Losartan 50mg (30 tablets) & Atorvastatin 10mg (30 tablets)', 1, 1680.0, 1680.0]
  );
  console.log('Seeded Invoices and Billing line items.');

  // 12. Employees (Staff Management)
  const employees = [
    { code: 'EMP-001', userId: 1, name: 'Dr. Arthur Pendelton', role: 'admin', deptId: 1, desig: 'Medical Director / Hospital Administrator', phone: '0771234560', email: 'admin@hms.hospital', join: '2018-01-10', salary: 350000.0 },
    { code: 'EMP-002', userId: 2, name: 'Dr. Priyantha Silva', role: 'doctor', deptId: 1, desig: 'Senior Consultant Physician', phone: '0771234561', email: 'dr.priyantha@hms.hospital', join: '2019-03-15', salary: 300000.0 },
    { code: 'EMP-003', userId: 3, name: 'Dr. Sarah Senanayake', role: 'doctor', deptId: 2, desig: 'Cardiologist', phone: '0771234562', email: 'dr.sarah@hms.hospital', join: '2020-07-01', salary: 320000.0 },
    { code: 'EMP-004', userId: 4, name: 'Chamari Fernando', role: 'nurse', deptId: 1, desig: 'Head Nurse - OPD', phone: '0771234563', email: 'chamari@hms.hospital', join: '2021-02-01', salary: 95000.0 },
    { code: 'EMP-005', userId: 5, name: 'Kavindu Bandara', role: 'receptionist', deptId: 1, desig: 'Front Office Receptionist', phone: '0771234564', email: 'reception@hms.hospital', join: '2022-05-10', salary: 65000.0 },
    { code: 'EMP-006', userId: 6, name: 'Nuwan Perera', role: 'lab_staff', deptId: 1, desig: 'Senior Medical Laboratory Technologist', phone: '0771234565', email: 'lab@hms.hospital', join: '2020-11-20', salary: 110000.0 },
    { code: 'EMP-007', userId: 7, name: 'Anoma Wickramasinghe', role: 'pharmacist', deptId: 1, desig: 'Chief Pharmacist', phone: '0771234566', email: 'pharmacy@hms.hospital', join: '2019-09-01', salary: 125000.0 },
    { code: 'EMP-008', userId: 8, name: 'Dinesh Jayasuriya', role: 'accountant', deptId: 1, desig: 'Senior Financial Accountant', phone: '0771234567', email: 'accounts@hms.hospital', join: '2020-04-15', salary: 135000.0 }
  ];

  for (const e of employees) {
    await runQuery(
      `INSERT INTO employees (employee_code, user_id, full_name, role, department_id, designation, phone, email, join_date, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.code, e.userId, e.name, e.role, e.deptId, e.desig, e.phone, e.email, e.join, e.salary]
    );
  }
  console.log('Seeded Staff & Employees.');

  // 13. Attendance for today
  for (let i = 1; i <= 8; i++) {
    await runQuery(
      `INSERT INTO attendance (employee_id, date, check_in_time, check_out_time, status)
       VALUES (?, ?, ?, ?, ?)`,
      [i, today, '08:00 AM', '05:00 PM', i === 3 ? 'Late' : 'Present']
    );
  }
  console.log('Seeded Attendance records.');

  // 14. Sample Leave Record
  await runQuery(
    `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status, approved_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [4, 'Annual', '2026-10-01', '2026-10-05', 'Family annual vacation', 'Approved', 1]
  );
  console.log('Seeded Leave records.');

  console.log('--- Database Seeding Completed Successfully! ---');
  db.close();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  db.close();
});
