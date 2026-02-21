import type { ListRow, TaskRow } from '@/types/domain';

export type { ListRow, TaskRow };

export interface TasksFeatureState {
  lists: ListRow[];
  tasks: TaskRow[];
  activeListId: string | null;
  loading: boolean;
  newTaskText: string;
  editingTaskId: string | null;
  isEditingTitle: boolean;
  titleEdit: string;
}
