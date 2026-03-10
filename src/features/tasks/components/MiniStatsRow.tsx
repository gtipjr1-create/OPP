import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

type MiniStatsRowProps = {
  pct: number;
  done: number;
  total: number;
  weightedPct: number;
  pointsDone: number;
  pointsTotal: number;
  scheduled: number;
};

export default function MiniStatsRow({
  pct,
  done,
  total,
  weightedPct,
  pointsDone,
  pointsTotal,
  scheduled,
}: MiniStatsRowProps) {
  return (
    <Card className="mt-2.5 p-1.5 md:hidden">
      <div className="grid grid-cols-3 gap-0.5">
        <div className="rounded-lg border border-white/5 bg-black/20 px-1.5 py-0.5">
          <SectionHeader className="text-[0.55rem]">COMPLETION</SectionHeader>
          <div className="text-task font-medium leading-none text-text-primary">{pct}%</div>
          <div className="text-meta font-mono tracking-wide text-text-secondary">
            {done}/{total}
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-black/20 px-1.5 py-0.5">
          <SectionHeader className="text-[0.55rem]">WEIGHTED</SectionHeader>
          <div className="text-task font-medium leading-none text-text-primary">{weightedPct}%</div>
          <div className="text-meta font-mono tracking-wide text-text-secondary">
            {pointsDone}/{pointsTotal}
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-black/20 px-1.5 py-0.5">
          <SectionHeader className="text-[0.55rem]">SCHEDULED</SectionHeader>
          <div className="text-task font-medium leading-none text-text-primary">{scheduled}</div>
          <div className="text-meta font-mono tracking-wide text-text-secondary">items</div>
        </div>
      </div>
    </Card>
  );
}
