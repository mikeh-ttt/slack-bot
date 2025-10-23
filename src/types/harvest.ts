export interface HarvestUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  telephone: string | null;
  timezone: string;
  has_access_to_all_future_projects: boolean;
  is_contractor: boolean;
  is_active: boolean;
  weekly_capacity: number; // seconds
  default_hourly_rate: number | null;
  cost_rate: number | null;
  roles: string[];
  access_roles: string[];
  avatar_url: string;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}
