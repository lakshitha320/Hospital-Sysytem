// Mock / Offline Database & API Simulator for HMS
// Allows the frontend to run 100% interactively on Vercel or any standalone host without a running backend.

const DEFAULT_USERS = [
  { id: 1, username: 'admin', role: 'admin', full_name: 'Dr. Arthur Pendelton', email: 'admin@hms.hospital', phone: '0771234560' },
  { id: 2, username: 'doctor', role: 'doctor', full_name: 'Dr. Priyantha Silva', email: 'dr.priyantha@hms.hospital', phone: '0771234561', doctor_id: 1 },
  { id: 3, username: 'doctor2', role: 'doctor', full_name: 'Dr. Sarah Senanayake', email: 'dr.sarah@hms.hospital', phone: '0771234562', doctor_id: 2 },
  { id: 4, username: 'nurse', role: 'nurse', full_name: 'Nurse Chamari Fernando', email: 'chamari@hms.hospital', phone: '0771234563' },
  { id: 5, username: 'receptionist', role: 'receptionist', full_name: 'Kavindu Bandara', email: 'reception@hms.hospital', phone: '0771234564' },
  { id: 6, username: 'lab_staff', role: 'lab_staff', full_name: 'Nuwan Perera (Lab Tech)', email: 'lab@hms.hospital', phone: '0771234565' },
  { id: 7, username: 'pharmacist', role: 'pharmacist', full_name: 'Anoma Wickramasinghe (B.Pharm)', email: 'pharmacy@hms.hospital', phone: '0771234566' },
  { id: 8, username: 'accountant', role: 'accountant', full_name: 'Dinesh Jayasuriya (CMA)', email: 'accounts@hms.hospital', phone: '0771234567' }
];

const DEFAULT_DEPARTMENTS = [
  { id: 1, name: 'General Medicine', description: 'Primary healthcare and diagnostic examinations', head_doctor_name: 'Dr. Priyantha Silva' },
  { id: 2, name: 'Cardiology', description: 'Heart and cardiovascular care', head_doctor_name: 'Dr. Sarah Senanayake' },
  { id: 3, name: 'Pediatrics', description: 'Infant, child, and adolescent medical care', head_doctor_name: 'Dr. M. De Alwis' },
  { id: 4, name: 'Orthopedics', description: 'Bones, joints, and musculoskeletal system', head_doctor_name: 'Dr. K. Jayatillake' },
  { id: 5, name: 'Dermatology', description: 'Skin, hair, and cosmetic treatments', head_doctor_name: 'Dr. R. Fonseka' }
];

const DEFAULT_DOCTORS = [
  { id: 1, user_id: 2, department_id: 1, full_name: 'Dr. Priyantha Silva', email: 'dr.priyantha@hms.hospital', phone: '0771234561', department_name: 'General Medicine', specialization: 'Consultant Physician', qualification: 'MBBS, MD (Medicine), MRCP (UK)', consultation_fee: 2500, available_days: 'Monday,Wednesday,Friday', start_time: '08:30 AM', end_time: '01:30 PM', room_number: 'Room 101' },
  { id: 2, user_id: 3, department_id: 2, full_name: 'Dr. Sarah Senanayake', email: 'dr.sarah@hms.hospital', phone: '0771234562', department_name: 'Cardiology', specialization: 'Consultant Cardiologist', qualification: 'MBBS, MD, FRCP, FACC', consultation_fee: 3500, available_days: 'Tuesday,Thursday,Saturday', start_time: '02:00 PM', end_time: '07:00 PM', room_number: 'Room 205' }
];

const DEFAULT_PATIENTS = [
  { id: 1, patient_code: 'PAT-1001', full_name: 'Sunil Weerasinghe', dob: '1984-05-14', gender: 'Male', blood_group: 'O+', phone: '0714589210', email: 'sunil.w@gmail.com', address: 'No 45, Temple Road, Colombo 03', emergency_contact: '0718889900 (Wife)', allergies: 'Penicillin', registered_at: '2026-09-20' },
  { id: 2, patient_code: 'PAT-1002', full_name: 'Malkanthi Rathnayake', dob: '1992-11-20', gender: 'Female', blood_group: 'A+', phone: '0773344556', email: 'malkanthi@gmail.com', address: 'No 12, Galle Road, Dehiwala', emergency_contact: '0772211445 (Husband)', allergies: 'Sulfa Drugs', registered_at: '2026-09-22' },
  { id: 3, patient_code: 'PAT-1003', full_name: 'Mohamed Rizwan', dob: '1978-03-08', gender: 'Male', blood_group: 'B+', phone: '0761239874', email: 'rizwan.m@yahoo.com', address: '88/2 Kandy Road, Kiribathgoda', emergency_contact: '0769991122 (Brother)', allergies: 'None', registered_at: '2026-09-25' },
  { id: 4, patient_code: 'PAT-1004', full_name: 'Nisansala Kumari', dob: '2001-08-25', gender: 'Female', blood_group: 'AB+', phone: '0703322114', email: 'nisansala.k@gmail.com', address: '14 Station Road, Maharagama', emergency_contact: '0708877665 (Father)', allergies: 'Aspirin', registered_at: '2026-09-28' }
];

const today = new Date().toISOString().split('T')[0];

const DEFAULT_APPOINTMENTS = [
  { id: 1, appointment_number: 'APT-2026-001', patient_id: 1, patient_name: 'Sunil Weerasinghe', patient_code: 'PAT-1001', doctor_id: 1, doctor_name: 'Dr. Priyantha Silva', department_id: 1, department_name: 'General Medicine', appointment_date: today, appointment_time: '09:00 AM', status: 'Completed', notes: 'Routine checkup and blood pressure monitoring' },
  { id: 2, appointment_number: 'APT-2026-002', patient_id: 2, patient_name: 'Malkanthi Rathnayake', patient_code: 'PAT-1002', doctor_id: 2, doctor_name: 'Dr. Sarah Senanayake', department_id: 2, department_name: 'Cardiology', appointment_date: today, appointment_time: '02:30 PM', status: 'Scheduled', notes: 'Chest tightness and shortness of breath' },
  { id: 3, appointment_number: 'APT-2026-003', patient_id: 3, patient_name: 'Mohamed Rizwan', patient_code: 'PAT-1003', doctor_id: 1, doctor_name: 'Dr. Priyantha Silva', department_id: 1, department_name: 'General Medicine', appointment_date: today, appointment_time: '11:00 AM', status: 'In Progress', notes: 'Fever, cough, and throat irritation for 3 days' },
  { id: 4, appointment_number: 'APT-2026-004', patient_id: 4, patient_name: 'Nisansala Kumari', patient_code: 'PAT-1004', doctor_id: 2, doctor_name: 'Dr. Sarah Senanayake', department_id: 2, department_name: 'Cardiology', appointment_date: today, appointment_time: '04:00 PM', status: 'Scheduled', notes: 'ECG review and follow-up' }
];

const DEFAULT_MEDICINES = [
  { id: 1, medicine_code: 'MED-001', name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin Trihydrate', category: 'Antibiotics', batch_number: 'AMX-2025-08', stock_quantity: 150, min_stock_level: 25, unit_price: 18.50, expiry_date: '2027-05-30', supplier: 'State Pharmaceuticals Corp' },
  { id: 2, medicine_code: 'MED-002', name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', category: 'Analgesics', batch_number: 'PCM-2026-01', stock_quantity: 600, min_stock_level: 100, unit_price: 5.00, expiry_date: '2028-01-15', supplier: 'GlaxoSmithKline SL' },
  { id: 3, medicine_code: 'MED-003', name: 'Losartan Potassium 50mg', generic_name: 'Losartan', category: 'Cardiovascular', batch_number: 'LOS-2025-11', stock_quantity: 240, min_stock_level: 50, unit_price: 24.00, expiry_date: '2027-09-10', supplier: 'Cipla Lanka' },
  { id: 4, medicine_code: 'MED-006', name: 'Cetirizine 10mg', generic_name: 'Cetirizine HCl', category: 'Antihistamines', batch_number: 'CTZ-2025-01', stock_quantity: 8, min_stock_level: 20, unit_price: 8.00, expiry_date: '2026-10-30', supplier: 'Emerchemie SL' }
];

const DEFAULT_LAB_TESTS = [
  { id: 1, test_code: 'LAB-FBC', test_name: 'Full Blood Count (FBC / CBC)', category: 'Hematology', sample_type: 'Whole Blood (EDTA)', cost: 1200, normal_range: 'Hb: 12-16 g/dL, WBC: 4000-11000 /uL' },
  { id: 2, test_code: 'LAB-FBS', test_name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', sample_type: 'Fluoride Plasma', cost: 650, normal_range: '70 - 100 mg/dL' },
  { id: 3, test_code: 'LAB-LIPID', test_name: 'Lipid Profile', category: 'Biochemistry', sample_type: 'Serum', cost: 2200, normal_range: 'Total Cholesterol < 200, Triglycerides < 150 mg/dL' },
  { id: 4, test_code: 'LAB-ECG', test_name: 'Electrocardiogram (ECG 12-lead)', category: 'Cardiology', sample_type: 'Surface Electrodes', cost: 1500, normal_range: 'Normal Sinus Rhythm' }
];

const DEFAULT_LAB_REQUESTS = [
  { id: 1, request_number: 'LR-2026-0001', patient_id: 1, patient_name: 'Sunil Weerasinghe', patient_code: 'PAT-1001', doctor_name: 'Dr. Priyantha Silva', test_id: 1, test_name: 'Full Blood Count (FBC / CBC)', category: 'Hematology', cost: 1200, sample_type: 'Whole Blood (EDTA)', status: 'Completed', result_value: 'Hb: 14.2 g/dL, WBC: 6800 /uL, Platelets: 240,000 /uL (Normal)', request_date: today },
  { id: 2, request_number: 'LR-2026-0002', patient_id: 2, patient_name: 'Malkanthi Rathnayake', patient_code: 'PAT-1002', doctor_name: 'Dr. Sarah Senanayake', test_id: 4, test_name: 'Electrocardiogram (ECG 12-lead)', category: 'Cardiology', cost: 1500, sample_type: 'Surface Electrodes', status: 'Pending', result_value: null, request_date: today }
];

const DEFAULT_INVOICES = [
  {
    id: 1,
    invoice_number: 'INV-2026-0001',
    patient_id: 1,
    patient_name: 'Sunil Weerasinghe',
    patient_code: 'PAT-1001',
    consultation_charges: 2500,
    laboratory_charges: 2200,
    pharmacy_charges: 1680,
    admission_charges: 0,
    tax: 0,
    discount: 150,
    total_amount: 6230,
    paid_amount: 6230,
    payment_status: 'Paid',
    payment_method: 'Card',
    created_at: today,
    notes: 'Full settlement paid via VISA credit card.',
    items: [
      { id: 1, description: 'Consultation - Dr. Priyantha Silva', quantity: 1, unit_price: 2500, total: 2500 },
      { id: 2, description: 'Laboratory Tests (FBC & FBS)', quantity: 1, unit_price: 2200, total: 2200 },
      { id: 3, description: 'Pharmacy Prescription Dispensing', quantity: 1, unit_price: 1680, total: 1680 }
    ]
  }
];

const DEFAULT_EMPLOYEES = [
  { id: 1, employee_code: 'EMP-001', full_name: 'Dr. Arthur Pendelton', role: 'admin', designation: 'Medical Director / Hospital Administrator', department_name: 'General Medicine', phone: '0771234560', email: 'admin@hms.hospital', join_date: '2018-01-10', salary: 350000 },
  { id: 2, employee_code: 'EMP-002', full_name: 'Dr. Priyantha Silva', role: 'doctor', designation: 'Senior Consultant Physician', department_name: 'General Medicine', phone: '0771234561', email: 'dr.priyantha@hms.hospital', join_date: '2019-03-15', salary: 300000 },
  { id: 3, employee_code: 'EMP-004', full_name: 'Chamari Fernando', role: 'nurse', designation: 'Head Nurse - OPD', department_name: 'General Medicine', phone: '0771234563', email: 'chamari@hms.hospital', join_date: '2021-02-01', salary: 95000 },
  { id: 4, employee_code: 'EMP-005', full_name: 'Kavindu Bandara', role: 'receptionist', designation: 'Front Office Receptionist', department_name: 'General Medicine', phone: '0771234564', email: 'reception@hms.hospital', join_date: '2022-05-10', salary: 65000 },
  { id: 5, employee_code: 'EMP-006', full_name: 'Nuwan Perera', role: 'lab_staff', designation: 'Senior Medical Laboratory Technologist', department_name: 'General Medicine', phone: '0771234565', email: 'lab@hms.hospital', join_date: '2020-11-20', salary: 110000 },
  { id: 6, employee_code: 'EMP-007', full_name: 'Anoma Wickramasinghe', role: 'pharmacist', designation: 'Chief Pharmacist', department_name: 'General Medicine', phone: '0771234566', email: 'pharmacy@hms.hospital', join_date: '2019-09-01', salary: 125000 },
  { id: 7, employee_code: 'EMP-008', full_name: 'Dinesh Jayasuriya', role: 'accountant', designation: 'Senior Financial Accountant', department_name: 'General Medicine', phone: '0771234567', email: 'accounts@hms.hospital', join_date: '2020-04-15', salary: 135000 }
];

const DEFAULT_PRESCRIPTIONS = [
  {
    id: 1,
    patient_id: 1,
    patient_name: 'Sunil Weerasinghe',
    patient_code: 'PAT-1001',
    doctor_name: 'Dr. Priyantha Silva',
    instructions: 'Take medication after meals regularly. Drink plenty of water.',
    status: 'Pending',
    created_at: today,
    items: [
      { id: 1, medicine_name: 'Losartan Potassium', dosage: '50mg', frequency: 'Once daily in the morning', duration: '30 days', quantity: 30, instructions: 'Take after breakfast' }
    ]
  }
];

const DEFAULT_ATTENDANCE = [
  { id: 1, employee_id: 1, employee_name: 'Dr. Arthur Pendelton', employee_code: 'EMP-001', role: 'admin', date: today, status: 'Present', check_in: '08:00 AM', check_out: '05:00 PM' },
  { id: 2, employee_id: 2, employee_name: 'Dr. Priyantha Silva', employee_code: 'EMP-002', role: 'doctor', date: today, status: 'Present', check_in: '08:20 AM', check_out: null },
  { id: 3, employee_id: 3, employee_name: 'Chamari Fernando', employee_code: 'EMP-004', role: 'nurse', date: today, status: 'Present', check_in: '07:45 AM', check_out: null },
  { id: 4, employee_id: 4, employee_name: 'Kavindu Bandara', employee_code: 'EMP-005', role: 'receptionist', date: today, status: 'Present', check_in: '08:00 AM', check_out: null }
];

const DEFAULT_LEAVES = [
  { id: 1, employee_id: 3, employee_name: 'Chamari Fernando', employee_code: 'EMP-004', role: 'nurse', leave_type: 'Annual', start_date: '2026-10-05', end_date: '2026-10-07', reason: 'Family vacation', status: 'Pending', applied_at: today }
];

// Local storage persistent database simulation
function getStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(`hms_db_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, data) {
  try {
    localStorage.setItem(`hms_db_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// Router simulator
export function handleMockRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const [pathOnly, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');
  let body = {};
  if (options.body) {
    body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
  }

  console.info(`[Demo Mode API] ${method} ${endpoint}`);

  // 1. AUTH
  if (pathOnly === '/auth/login' && method === 'POST') {
    const { username, password } = body;
    const user = DEFAULT_USERS.find(u => u.username === username);
    if (!user) {
      throw new Error('Invalid username or password');
    }
    // Allow any demo account with password123 or any password for demo ease
    return {
      token: `demo_jwt_token_${user.id}_${Date.now()}`,
      user: { ...user }
    };
  }

  if (pathOnly === '/auth/me' && method === 'GET') {
    const raw = localStorage.getItem('hms_user');
    const u = raw ? JSON.parse(raw) : DEFAULT_USERS[0];
    return { ...u };
  }

  if (pathOnly === '/auth/demo-users' && method === 'GET') {
    return DEFAULT_USERS.map(u => ({ username: u.username, role: u.role, full_name: u.full_name }));
  }

  // 2. DASHBOARD
  if (pathOnly === '/dashboard/summary') {
    const patients = getStorage('patients', DEFAULT_PATIENTS);
    const appointments = getStorage('appointments', DEFAULT_APPOINTMENTS);
    const invoices = getStorage('invoices', DEFAULT_INVOICES);
    const medicines = getStorage('medicines', DEFAULT_MEDICINES);
    const labRequests = getStorage('lab_requests', DEFAULT_LAB_REQUESTS);

    const totalBilled = invoices.reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0);
    const totalCollected = invoices.reduce((acc, i) => acc + (Number(i.paid_amount) || 0), 0);

    return {
      total_patients: patients.length,
      todays_appointments: appointments.filter(a => a.appointment_date === today).length,
      total_appointments: appointments.length,
      revenue: {
        total_billed: totalBilled,
        total_collected: totalCollected,
        pending_dues: totalBilled - totalCollected
      },
      laboratory: {
        total_requests: labRequests.length,
        pending: labRequests.filter(l => l.status === 'Pending').length,
        in_progress: labRequests.filter(l => l.status === 'Sample Collected').length,
        completed: labRequests.filter(l => l.status === 'Completed').length
      },
      pharmacy_alerts: {
        low_stock: medicines.filter(m => m.stock_quantity <= m.min_stock_level).length,
        expiring_soon: 1
      },
      recent_appointments: appointments.slice(0, 5),
      recent_invoices: invoices.slice(0, 5)
    };
  }

  // 3. PATIENTS
  if (pathOnly === '/patients') {
    let patients = getStorage('patients', DEFAULT_PATIENTS);
    if (method === 'GET') {
      const search = (params.get('search') || '').toLowerCase();
      if (search) {
        patients = patients.filter(p =>
          p.full_name.toLowerCase().includes(search) ||
          p.patient_code.toLowerCase().includes(search) ||
          p.phone.includes(search)
        );
      }
      return patients;
    }
    if (method === 'POST') {
      const newP = {
        id: Date.now(),
        patient_code: `PAT-${1000 + patients.length + 1}`,
        registered_at: today,
        ...body
      };
      patients.unshift(newP);
      setStorage('patients', patients);
      return newP;
    }
  }

  if (pathOnly.startsWith('/patients/')) {
    const id = Number(pathOnly.split('/')[2]);
    let patients = getStorage('patients', DEFAULT_PATIENTS);
    if (method === 'GET') {
      return patients.find(p => p.id === id) || patients[0];
    }
    if (method === 'PUT') {
      patients = patients.map(p => p.id === id ? { ...p, ...body } : p);
      setStorage('patients', patients);
      return { success: true };
    }
  }

  // 4. DOCTORS & DEPARTMENTS
  if (pathOnly === '/doctors') {
    let doctors = getStorage('doctors', DEFAULT_DOCTORS);
    if (method === 'GET') return doctors;
    if (method === 'POST') {
      const newDoc = { id: Date.now(), ...body };
      doctors.push(newDoc);
      setStorage('doctors', doctors);
      return newDoc;
    }
  }
  if (pathOnly === '/doctors/departments') {
    return DEFAULT_DEPARTMENTS;
  }

  // 5. APPOINTMENTS
  if (pathOnly === '/appointments') {
    let appointments = getStorage('appointments', DEFAULT_APPOINTMENTS);
    if (method === 'GET') {
      const date = params.get('date');
      const doctorId = params.get('doctor_id');
      const status = params.get('status');
      let filtered = [...appointments];
      if (date) filtered = filtered.filter(a => a.appointment_date === date);
      if (doctorId) filtered = filtered.filter(a => String(a.doctor_id) === String(doctorId));
      if (status) filtered = filtered.filter(a => a.status === status);
      return filtered;
    }
    if (method === 'POST') {
      const patients = getStorage('patients', DEFAULT_PATIENTS);
      const doctors = getStorage('doctors', DEFAULT_DOCTORS);
      const patient = patients.find(p => p.id === Number(body.patient_id));
      const doctor = doctors.find(d => d.id === Number(body.doctor_id));

      const newApt = {
        id: Date.now(),
        appointment_number: `APT-2026-${String(appointments.length + 1).padStart(3, '0')}`,
        patient_name: patient?.full_name || 'Patient',
        patient_code: patient?.patient_code || 'PAT-1000',
        doctor_name: doctor?.full_name || 'Doctor',
        department_name: doctor?.department_name || 'General',
        status: 'Scheduled',
        ...body
      };
      appointments.unshift(newApt);
      setStorage('appointments', appointments);
      return newApt;
    }
  }

  if (pathOnly.startsWith('/appointments/') && pathOnly.endsWith('/status') && method === 'PUT') {
    const id = Number(pathOnly.split('/')[2]);
    let appointments = getStorage('appointments', DEFAULT_APPOINTMENTS);
    appointments = appointments.map(a => a.id === id ? { ...a, status: body.status } : a);
    setStorage('appointments', appointments);
    return { success: true };
  }

  // 6. EMR & PRESCRIPTIONS
  if (pathOnly.startsWith('/emr/patient/')) {
    const patientId = Number(pathOnly.split('/')[3]);
    const prescriptions = getStorage('prescriptions', DEFAULT_PRESCRIPTIONS);
    return {
      records: [
        {
          id: 1,
          appointment_id: 1,
          doctor_name: 'Dr. Priyantha Silva',
          diagnosis: 'Essential Hypertension Stage 1',
          symptoms: 'Mild headache and dizziness',
          treatment_plan: 'Dietary modifications and Losartan 50mg daily',
          blood_pressure: '142/90 mmHg',
          pulse_rate: '78 bpm',
          temperature: '98.4 F',
          weight: '74 kg',
          created_at: today,
          prescriptions: prescriptions.filter(p => p.patient_id === patientId)
        }
      ]
    };
  }

  if (pathOnly === '/emr' && method === 'POST') {
    return { id: Date.now(), ...body };
  }

  if (pathOnly === '/emr/prescriptions') {
    let prescriptions = getStorage('prescriptions', DEFAULT_PRESCRIPTIONS);
    return prescriptions;
  }

  if (pathOnly.startsWith('/emr/prescriptions/') && pathOnly.endsWith('/dispense') && method === 'PUT') {
    const id = Number(pathOnly.split('/')[3]);
    let prescriptions = getStorage('prescriptions', DEFAULT_PRESCRIPTIONS);
    prescriptions = prescriptions.map(p => p.id === id ? { ...p, status: 'Dispensed' } : p);
    setStorage('prescriptions', prescriptions);
    return { success: true };
  }

  // 7. LAB TESTS & REQUESTS
  if (pathOnly === '/lab/tests') {
    let tests = getStorage('lab_tests', DEFAULT_LAB_TESTS);
    if (method === 'GET') return tests;
    if (method === 'POST') {
      const newT = { id: Date.now(), ...body };
      tests.push(newT);
      setStorage('lab_tests', tests);
      return newT;
    }
  }

  if (pathOnly === '/lab/requests') {
    let requests = getStorage('lab_requests', DEFAULT_LAB_REQUESTS);
    if (method === 'GET') return requests;
    if (method === 'POST') {
      const patients = getStorage('patients', DEFAULT_PATIENTS);
      const tests = getStorage('lab_tests', DEFAULT_LAB_TESTS);
      const p = patients.find(pt => pt.id === Number(body.patient_id));
      const t = tests.find(ts => ts.id === Number(body.test_id));
      const newReq = {
        id: Date.now(),
        request_number: `LR-2026-${String(requests.length + 1).padStart(4, '0')}`,
        patient_name: p?.full_name || 'Patient',
        patient_code: p?.patient_code || 'PAT-1000',
        test_name: t?.test_name || 'Test',
        category: t?.category || 'General',
        sample_type: t?.sample_type || 'Blood',
        cost: t?.cost || 1000,
        status: 'Pending',
        request_date: today,
        ...body
      };
      requests.unshift(newReq);
      setStorage('lab_requests', requests);
      return newReq;
    }
  }

  if (pathOnly.startsWith('/lab/requests/') && pathOnly.endsWith('/collect-sample') && method === 'PUT') {
    const id = Number(pathOnly.split('/')[3]);
    let requests = getStorage('lab_requests', DEFAULT_LAB_REQUESTS);
    requests = requests.map(r => r.id === id ? { ...r, status: 'Sample Collected' } : r);
    setStorage('lab_requests', requests);
    return { success: true };
  }

  if (pathOnly.startsWith('/lab/requests/') && pathOnly.endsWith('/result') && method === 'PUT') {
    const id = Number(pathOnly.split('/')[3]);
    let requests = getStorage('lab_requests', DEFAULT_LAB_REQUESTS);
    requests = requests.map(r => r.id === id ? { ...r, status: 'Completed', result_value: body.result_value } : r);
    setStorage('lab_requests', requests);
    return { success: true };
  }

  // 8. PHARMACY
  if (pathOnly === '/pharmacy/medicines') {
    let medicines = getStorage('medicines', DEFAULT_MEDICINES);
    if (method === 'GET') return medicines;
    if (method === 'POST') {
      const newMed = {
        id: Date.now(),
        medicine_code: `MED-${String(medicines.length + 1).padStart(3, '0')}`,
        ...body
      };
      medicines.unshift(newMed);
      setStorage('medicines', medicines);
      return newMed;
    }
  }

  if (pathOnly === '/pharmacy/alerts') {
    const medicines = getStorage('medicines', DEFAULT_MEDICINES);
    return {
      low_stock: medicines.filter(m => m.stock_quantity <= m.min_stock_level),
      expiring: medicines.filter(m => m.id === 4)
    };
  }

  if (pathOnly.startsWith('/pharmacy/medicines/')) {
    const id = Number(pathOnly.split('/')[3]);
    let medicines = getStorage('medicines', DEFAULT_MEDICINES);
    if (method === 'PUT') {
      medicines = medicines.map(m => m.id === id ? { ...m, ...body } : m);
      setStorage('medicines', medicines);
      return { success: true };
    }
    if (method === 'DELETE') {
      medicines = medicines.filter(m => m.id !== id);
      setStorage('medicines', medicines);
      return { success: true };
    }
  }

  // 9. BILLING & INVOICES
  if (pathOnly === '/billing/invoices') {
    let invoices = getStorage('invoices', DEFAULT_INVOICES);
    if (method === 'GET') return invoices;
    if (method === 'POST') {
      const patients = getStorage('patients', DEFAULT_PATIENTS);
      const p = patients.find(pt => pt.id === Number(body.patient_id));
      const total = Number(body.consultation_charges || 0) + Number(body.laboratory_charges || 0) + Number(body.pharmacy_charges || 0) - Number(body.discount || 0);
      const newInv = {
        id: Date.now(),
        invoice_number: `INV-2026-${String(invoices.length + 1).padStart(4, '0')}`,
        patient_name: p?.full_name || 'Patient',
        patient_code: p?.patient_code || 'PAT-1000',
        total_amount: total,
        paid_amount: body.paid_amount || 0,
        payment_status: (body.paid_amount >= total) ? 'Paid' : (body.paid_amount > 0 ? 'Partial' : 'Unpaid'),
        created_at: today,
        ...body
      };
      invoices.unshift(newInv);
      setStorage('invoices', invoices);
      return newInv;
    }
  }

  if (pathOnly.startsWith('/billing/invoices/') && pathOnly.endsWith('/payment') && method === 'PUT') {
    const id = Number(pathOnly.split('/')[3]);
    let invoices = getStorage('invoices', DEFAULT_INVOICES);
    invoices = invoices.map(inv => {
      if (inv.id === id) {
        const newPaid = Number(inv.paid_amount || 0) + Number(body.amount || 0);
        return {
          ...inv,
          paid_amount: newPaid,
          payment_status: newPaid >= inv.total_amount ? 'Paid' : 'Partial'
        };
      }
      return inv;
    });
    setStorage('invoices', invoices);
    return { success: true };
  }

  if (pathOnly.startsWith('/billing/invoices/')) {
    const id = Number(pathOnly.split('/')[3]);
    const invoices = getStorage('invoices', DEFAULT_INVOICES);
    return invoices.find(inv => inv.id === id) || invoices[0];
  }

  // 10. STAFF & EMPLOYEES
  if (pathOnly === '/staff/employees') {
    let employees = getStorage('employees', DEFAULT_EMPLOYEES);
    if (method === 'GET') return employees;
    if (method === 'POST') {
      const newEmp = {
        id: Date.now(),
        employee_code: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
        ...body
      };
      employees.push(newEmp);
      setStorage('employees', employees);
      return newEmp;
    }
  }

  if (pathOnly === '/staff/attendance') {
    let attendance = getStorage('attendance', DEFAULT_ATTENDANCE);
    if (method === 'GET') return attendance;
    if (method === 'POST') {
      const newAtt = { id: Date.now(), date: today, status: 'Present', ...body };
      attendance.unshift(newAtt);
      setStorage('attendance', attendance);
      return newAtt;
    }
  }

  if (pathOnly === '/staff/leaves') {
    let leaves = getStorage('leaves', DEFAULT_LEAVES);
    if (method === 'GET') return leaves;
    if (method === 'POST') {
      const newL = { id: Date.now(), status: 'Pending', applied_at: today, ...body };
      leaves.unshift(newL);
      setStorage('leaves', leaves);
      return newL;
    }
  }

  if (pathOnly.startsWith('/staff/leaves/') && pathOnly.endsWith('/status') && method === 'PUT') {
    const id = Number(pathOnly.split('/')[3]);
    let leaves = getStorage('leaves', DEFAULT_LEAVES);
    leaves = leaves.map(l => l.id === id ? { ...l, status: body.status } : l);
    setStorage('leaves', leaves);
    return { success: true };
  }

  // 11. REPORTS
  if (pathOnly === '/reports/summary') {
    return {
      revenue: {
        consultation_total: 25000,
        lab_total: 18400,
        pharmacy_total: 32600,
        admission_total: 15000,
        grand_total: 91000
      },
      appointments_by_status: [
        { status: 'Completed', count: 18 },
        { status: 'Scheduled', count: 9 },
        { status: 'In Progress', count: 3 },
        { status: 'Cancelled', count: 1 }
      ],
      appointments_by_dept: [
        { department: 'General Medicine', count: 14 },
        { department: 'Cardiology', count: 8 },
        { department: 'Pediatrics', count: 5 },
        { department: 'Orthopedics', count: 4 }
      ],
      patient_gender: [
        { gender: 'Male', count: 16 },
        { gender: 'Female', count: 15 }
      ],
      patient_blood: [
        { blood_group: 'O+', count: 12 },
        { blood_group: 'A+', count: 8 },
        { blood_group: 'B+', count: 7 },
        { blood_group: 'AB+', count: 4 }
      ],
      pharmacy_overview: {
        total_items: 24,
        inventory_value: 345000,
        low_stock_items: 2,
        near_expiry_items: 1
      },
      lab_stats: [
        { category: 'Hematology', total_tests: 14, total_value: 16800 },
        { category: 'Biochemistry', total_tests: 10, total_value: 12500 },
        { category: 'Cardiology', total_tests: 6, total_value: 9000 }
      ],
      staff_by_role: [
        { role: 'doctor', count: 4 },
        { role: 'nurse', count: 8 },
        { role: 'admin', count: 2 },
        { role: 'pharmacist', count: 3 },
        { role: 'lab_staff', count: 3 },
        { role: 'receptionist', count: 4 },
        { role: 'accountant', count: 2 }
      ]
    };
  }

  // Fallback
  return { success: true };
}
