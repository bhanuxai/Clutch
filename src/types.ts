export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO string
  category: "work" | "study" | "personal" | "bills" | "other";
  priority: "high" | "medium" | "low";
  estimatedMinutes: number;
  isCompleted: boolean;
  notes: string;
  aiScore?: number;
  aiRecommendation?: string;
  googleEventId?: string;
  tags?: string[];
  completedAt?: string; // ISO string when completed
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  lastCompleted?: string; // YYYY-MM-DD
  category: string;
}

export interface ItineraryItem {
  time: string;
  task: string;
  isBuffer: boolean;
  focusTip: string;
}

export interface AppData {
  tasks: Task[];
  habits: Habit[];
  itinerary: ItineraryItem[];
  generalAdvice: string;
}
