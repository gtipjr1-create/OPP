export interface ListRow {
  id: string;
  title: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  list_id: string;
  content: string;
  priority?: 'high' | 'normal' | 'low' | null;
  tagged_priority?: 'high' | 'normal' | 'low' | null;
  scheduled_time?: string | null;
  scheduled_for?: string | null;
  is_done: boolean;
  position: number;
  created_at: string;
}
