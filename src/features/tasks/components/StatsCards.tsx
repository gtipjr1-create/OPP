import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

type StatsCardsProps = {
  pct: number;
  done: number;
  total: number;
  weightedPct: number;
  pointsDone: number;
  pointsTotal: number;
  scheduled: number;
};

export default function StatsCards({
  pct,
  done,
  total,
  weightedPct,
  pointsDone,
  pointsTotal,
  scheduled,
}: StatsCardsProps) {
  return (
    <div className="mt-4">
      <Card className="space-y-3 md:hidden">
        <div>
          <div className="flex items-center justify-between gap-3">
            <SectionHeader>COMPLETION</SectionHeader>
            <div className="text-task font-medium text-text-primary">{pct}%</div>
          </div>
          <div className="mt-1 text-right text-meta font-mono tracking-wide text-text-secondary">
            {done}/{total}
          </div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <div className="flex items-center justify-between gap-3">
            <SectionHeader>WEIGHTED</SectionHeader>
            <div className="text-task font-medium text-text-primary">{weightedPct}%</div>
          </div>
          <div className="mt-1 text-right text-meta font-mono tracking-wide text-text-secondary">
            {pointsDone}/{pointsTotal}
          </div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <div className="flex items-center justify-between gap-3">
            <SectionHeader>SCHEDULED</SectionHeader>
            <div className="text-task font-medium text-text-primary">{scheduled} items</div>
          </div>
          <div className="mt-1 truncate text-meta font-mono tracking-wide text-text-secondary">
            Only tasks with a time appear on the rail.
          </div>
        </div>
      </Card>

      <div className="hidden gap-3 md:grid md:grid-cols-3">
        <Card>
          <SectionHeader>COMPLETION</SectionHeader>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-[2.25rem] font-bold tracking-tight text-text-primary">{pct}%</div>
            <div className="text-meta font-mono tracking-wide text-text-secondary">
              {done}/{total}
            </div>
          </div>
          <div className="mt-2 h-2 w-full rounded-[999px] bg-white/8">
            <div className="h-2 rounded-full bg-blue-500/80" style={{ width: `${pct}%` }} />
          </div>
        </Card>

        <Card>
          <SectionHeader>WEIGHTED</SectionHeader>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-[2.25rem] font-bold tracking-tight text-text-primary">{weightedPct}%</div>
            <div className="text-meta font-mono tracking-wide text-text-secondary">
              {pointsDone}/{pointsTotal}
            </div>
          </div>
          <div className="mt-2 h-2 w-full rounded-[999px] bg-white/8">
            <div className="h-2 rounded-full bg-blue-500/80" style={{ width: `${weightedPct}%` }} />
          </div>
        </Card>

        <Card>
          <SectionHeader>SCHEDULED</SectionHeader>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-[2.25rem] font-bold tracking-tight text-text-primary">{scheduled}</div>
            <div className="text-meta font-mono tracking-wide text-text-secondary">items</div>
          </div>
          <div className="mt-2 text-meta font-mono tracking-wide text-text-secondary">
            Only tasks with a time appear on the rail.
          </div>
        </Card>
      </div>
    </div>
  );
}
