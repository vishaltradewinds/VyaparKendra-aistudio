export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'mitra';
  kyc_status: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  commission: number;
  description?: string;
  processing_time?: string;
}

export interface ServiceRequest {
  id: string;
  mitra_id: string;
  citizen_name: string;
  citizen_phone?: string;
  id_number?: string;
  service_id: string;
  status: 'in_progress' | 'completed';
  notes?: string;
  created_at: string;
  service_name?: string;
  commission?: number;
}

export interface Loan {
  id: string;
  mitra_id: string;
  applicant: string;
  phone?: string;
  amount: number;
  purpose?: string;
  tenure?: number;
  income?: number;
  status: 'submitted' | 'approved' | 'rejected';
  created_at: string;
}

export interface Analytics {
  total_mitras: number;
  total_requests: number;
  total_revenue: number;
}
