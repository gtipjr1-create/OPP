import { ChevronDown } from 'lucide-react';

import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SectionHeader from '@/components/ui/SectionHeader';
import type { ListRow } from '../types';

type ListStats = {
  totalTasks: number;
  completionPct: number;
  modifiedAt: string;
};

type ArchiveLogsPanelProps = {
  lists: ListRow[];
  activeListId: string | null;
  listStatsById: Record<string, ListStats>;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectList: (listId: string) => void;
};

function formatModifiedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function ArchiveLogsPanel({
  lists,
  activeListId,
  listStatsById,
  isOpen,
  onToggleOpen,
  onSelectList,
}: ArchiveLogsPanelProps) {
  return (
    <Card className="mt-4 rounded-3xl">
      <div className="flex items-center justify-between">
        <SectionHeader>ARCHIVED LOGS</SectionHeader>
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:text-text-primary"
        >
          <span>{isOpen ? 'Hide' : `Show (${lists.length})`}</span>
          <ChevronDown size={14} className={['transition-transform duration-200', isOpen ? 'rotate-180' : 'rotate-0'].join(' ')} />
        </button>
      </div>

      {isOpen ? (
        <>
          <Card tone="dark" className="mt-2 flex items-center gap-3">
            <Input placeholder="Search history..." className="flex-1" />
          </Card>

          <div className="mt-4 space-y-2 text-meta font-mono tracking-wide text-text-secondary">
            {lists.slice(0, 6).map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => onSelectList(list.id)}
                className={[
                  'block w-full rounded-xl border bg-black/30 p-4 text-left transition-colors',
                  activeListId === list.id
                    ? 'border-[color:var(--state-active)]/80 bg-blue-500/10 text-text-primary shadow-[inset_0_0_0_1px_rgba(96,165,250,0.25)]'
                    : 'border-white/10 text-[color:var(--state-archived)] hover:bg-black/50',
                ].join(' ')}
              >
                <div className="truncate text-task font-medium text-text-primary">{list.title}</div>
                <div className="mt-2 text-meta font-mono tracking-wide text-text-secondary">
                  {(() => {
                    const stats = listStatsById[list.id];
                    if (!stats) {
                      return `${new Date(list.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })} | --% | -- tasks | updated ${formatModifiedDate(list.created_at)}`;
                    }
                    return `${stats.completionPct}% complete | ${stats.totalTasks} tasks | updated ${formatModifiedDate(stats.modifiedAt)}`;
                  })()}
                </div>
              </button>
            ))}
            {lists.length === 0 ? <div>No archived sessions yet.</div> : null}
            {lists.length > 6 ? <SectionHeader>Showing latest 6 sessions.</SectionHeader> : null}
          </div>
        </>
      ) : null}
    </Card>
  );
}
