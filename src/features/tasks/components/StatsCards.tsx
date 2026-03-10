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
  );
}
