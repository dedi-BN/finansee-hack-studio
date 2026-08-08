export type HackStatus = "Draft" | "Professional Review" | "Approved" | "Published";

export interface Hack {
  id: number;
  number: number;
  title: string;
  subtitle: string;
  hook: string;
  why_it_matters: string;
  problem: string;
  example_story: string;
  content: string;
  action_steps: string[];
  cautions: string;
  bottom_line: string;
  cta: string;
  professional_notes: string;
  sources: string;
  age_groups: string[];
  family_status: string[];
  employment: string[];
  financial_status: string[];
  expertise: string[];
  importance: number;
  virality: number;
  potential_savings: number;
  urgency: number;
  status: HackStatus;
  created_at: string;
  updated_at: string;
}

export type HackInput = Omit<Hack, "id" | "number" | "created_at" | "updated_at">;

export interface DashboardStats {
  total: number;
  draft: number;
  professional_review: number;
  approved: number;
  published: number;
}
