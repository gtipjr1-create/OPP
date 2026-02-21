export interface ListRow {
  id: string;
  title: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  list_id: string;
  content: string;
  is_done: boolean;
  created_at: string;
}
