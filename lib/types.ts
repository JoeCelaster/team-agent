export type AccessStatus = "not_requested" | "pending" | "granted" | "denied";
export type AccessType = "mandatory" | "optional" | "common";

export type Session = {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  status: "invited" | "active";
  org_id: string;
  role_id: string;
  role_name: string;
  color_hex: string;
  org_name: string;
  email_domain: string;
};

// employee_access_view row
export type AccessRow = {
  employee_id: string;
  resource_id: string;
  resource_name: string;
  description: string | null;
  category: "role" | "common";
  access_type: AccessType;
  is_mandatory: boolean | null;
  access_link: string | null;
  doc_link: string | null;
  avg_provisioning_days: number;
  escalation_contact: string | null;
  access_status: AccessStatus;
  requested_at: string | null;
  granted_at: string | null;
  denied_at: string | null;
};

// admin_requests_view row
export type AdminRequestRow = {
  request_id: string;
  org_id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  role_name: string;
  resource_id: string;
  resource_name: string;
  requested_by: "employee" | "agent";
  is_role_relevant: boolean;
  employee_note: string | null;
  admin_note: string | null;
  request_status: "pending" | "approved" | "denied";
  requested_at: string;
  reviewed_at: string | null;
};

// org_onboarding_stats view row (actual DB column names)
export type OrgStats = {
  org_id: string;
  org_name: string;
  total_employees: number;
  active_count: number;
  pending_login_count: number;
  open_requests: number;
  approved_requests: number;
};
