export interface StaffCommissionSummary {
  staff_id: string;
  name: string;
  total_earned: number;
}

export interface RecentCommission {
  id: string;
  date: string;
  staff_name: string;
  service_name: string;
  amount: number;
}
