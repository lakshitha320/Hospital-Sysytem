const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getStoredToken() {
  return localStorage.getItem('hms_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('hms_token', token);
  } else {
    localStorage.removeItem('hms_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('hms_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('hms_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('hms_user');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP error! status: ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  getMe: () => apiRequest('/auth/me'),
  getDemoUsers: () => apiRequest('/auth/demo-users'),

  // Dashboard
  getDashboardSummary: () => apiRequest('/dashboard/summary'),

  // Patients
  getPatients: (search = '') => apiRequest(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getPatientById: (id) => apiRequest(`/patients/${id}`),
  createPatient: (data) => apiRequest('/patients', { method: 'POST', body: data }),
  updatePatient: (id, data) => apiRequest(`/patients/${id}`, { method: 'PUT', body: data }),

  // Doctors
  getDoctors: () => apiRequest('/doctors'),
  getDepartments: () => apiRequest('/doctors/departments'),
  createDoctor: (data) => apiRequest('/doctors', { method: 'POST', body: data }),
  updateDoctor: (id, data) => apiRequest(`/doctors/${id}`, { method: 'PUT', body: data }),

  // Appointments
  getAppointments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/appointments${query ? `?${query}` : ''}`);
  },
  createAppointment: (data) => apiRequest('/appointments', { method: 'POST', body: data }),
  updateAppointmentStatus: (id, status) => apiRequest(`/appointments/${id}/status`, { method: 'PUT', body: { status } }),
  updateAppointment: (id, data) => apiRequest(`/appointments/${id}`, { method: 'PUT', body: data }),

  // EMR & Prescriptions
  getPatientEMR: (patientId) => apiRequest(`/emr/patient/${patientId}`),
  createEMRRecord: (data) => apiRequest('/emr', { method: 'POST', body: data }),
  getPrescriptions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/emr/prescriptions${query ? `?${query}` : ''}`);
  },
  dispensePrescription: (id) => apiRequest(`/emr/prescriptions/${id}/dispense`, { method: 'PUT' }),

  // Laboratory
  getLabTests: () => apiRequest('/lab/tests'),
  createLabTest: (data) => apiRequest('/lab/tests', { method: 'POST', body: data }),
  getLabRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/lab/requests${query ? `?${query}` : ''}`);
  },
  createLabRequest: (data) => apiRequest('/lab/requests', { method: 'POST', body: data }),
  collectLabSample: (id) => apiRequest(`/lab/requests/${id}/collect-sample`, { method: 'PUT' }),
  recordLabResult: (id, data) => apiRequest(`/lab/requests/${id}/result`, { method: 'PUT', body: data }),

  // Pharmacy
  getMedicines: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/pharmacy/medicines${query ? `?${query}` : ''}`);
  },
  getPharmacyAlerts: () => apiRequest('/pharmacy/alerts'),
  createMedicine: (data) => apiRequest('/pharmacy/medicines', { method: 'POST', body: data }),
  updateMedicine: (id, data) => apiRequest(`/pharmacy/medicines/${id}`, { method: 'PUT', body: data }),
  deleteMedicine: (id) => apiRequest(`/pharmacy/medicines/${id}`, { method: 'DELETE' }),

  // Billing
  getInvoices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/billing/invoices${query ? `?${query}` : ''}`);
  },
  getInvoiceById: (id) => apiRequest(`/billing/invoices/${id}`),
  createInvoice: (data) => apiRequest('/billing/invoices', { method: 'POST', body: data }),
  recordPayment: (id, data) => apiRequest(`/billing/invoices/${id}/payment`, { method: 'PUT', body: data }),

  // Staff
  getEmployees: () => apiRequest('/staff/employees'),
  createEmployee: (data) => apiRequest('/staff/employees', { method: 'POST', body: data }),
  getAttendance: (date) => apiRequest(`/staff/attendance${date ? `?date=${date}` : ''}`),
  markAttendance: (data) => apiRequest('/staff/attendance', { method: 'POST', body: data }),
  getLeaves: () => apiRequest('/staff/leaves'),
  applyLeave: (data) => apiRequest('/staff/leaves', { method: 'POST', body: data }),
  updateLeaveStatus: (id, status) => apiRequest(`/staff/leaves/${id}/status`, { method: 'PUT', body: { status } }),

  // Reports
  getReportsSummary: () => apiRequest('/reports/summary')
};
