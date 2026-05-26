export type DateStatus = "pending" | "confirmed" | "past";
export type TaskStatus = "todo" | "done";
export type SyncMode = "cloud" | "local";

export interface Profile {
  id: string;
  display_name: string;
  home_area: string;
  commute_minutes: number;
  education: string;
  major: string;
  age: number | null;
  certificates: string;
  political_status: string;
  work_years: number;
  target_note: string;
  created_at?: string;
  updated_at?: string;
}

export interface Exam {
  id: string;
  user_id: string;
  name: string;
  category: string;
  target_date: string | null;
  date_status: DateStatus;
  source_url: string;
  notes: string;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudyTask {
  id: string;
  user_id: string;
  title: string;
  track: string;
  task_date: string;
  duration_minutes: number;
  status: TaskStatus;
  review_note: string;
  wrong_note: string;
  created_at?: string;
  updated_at?: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  checkin_date: string;
  mood: string;
  minutes: number;
  summary: string;
  created_at?: string;
  updated_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  metric: string;
  target: number;
  current: number;
  due_date: string | null;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface TargetUnit {
  id: string;
  user_id: string;
  name: string;
  kind: string;
  area: string;
  commute_score: number;
  stability_score: number;
  fit_note: string;
  priority: number;
  status: string;
  source_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudyData {
  profile: Profile;
  exams: Exam[];
  study_tasks: StudyTask[];
  checkins: Checkin[];
  goals: Goal[];
  target_units: TargetUnit[];
}
