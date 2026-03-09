import { ChevronDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

type DotPriority = 'high' | 'normal' | 'low' | undefined;

type ScheduleRailProps = {
  currentHour: number;
  scheduledCount: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  dotPriorityByHour: Record<number, DotPriority>;
};

const hours = Array.from({ length: 17 }, (_, i) => i + 6);

function formatHour(hour: number) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hr = ((hour + 11) % 12) + 1;
  return `${hr}${ampm}`;
}

export default function ScheduleRail({
  currentHour,
  scheduledCount,
  isOpen,
  onToggleOpen,
  dotPriorityByHour,
}: ScheduleRailProps) {
  return (
    <Card className="order-2 rounded-3xl md:order-1">
      <div className="flex min-h-[44px] items-center justify-between">
        <SectionHeader>SCHEDULE</SectionHeader>
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Hide schedule rail' : `Show schedule rail (${scheduledCount} scheduled)`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <span className="sr-only">{isOpen ? 'Collapse schedule' : 'Expand schedule'}</span>
          <span>{isOpen ? 'Hide' : `Show (${scheduledCount})`}</span>
          <ChevronDown size={14} className={['transition-transform duration-200', isOpen ? 'rotate-180' : 'rotate-0'].join(' ')} />
        </button>
      </div>

      {isOpen ? (
        <div className="mt-2 space-y-2">
          {hours.map((hour) => {
            const label = formatHour(hour);
            const isCurrentHour = hour === currentHour;
            const dotPriority = dotPriorityByHour[hour];
            const dotClass =
              dotPriority === 'high'
                ? 'bg-[color:var(--priority-high)]'
                : dotPriority === 'normal'
                  ? 'bg-[color:var(--priority-normal)]'
                  : dotPriority === 'low'
                    ? 'bg-[color:var(--priority-low)]'
                    : '';

            return (
              <div
                key={hour}
                className="flex items-start gap-3"
                aria-label={`${label}${dotPriority ? ` ${dotPriority} priority task scheduled` : ''}`}
              >
                <div className="w-11 shrink-0 pt-1 text-label font-mono tracking-wide text-text-tertiary">{label}</div>

                <div
                  className={[
                    'min-h-[22px] flex-1 border-l pl-3',
                    isCurrentHour ? 'border-[color:var(--state-active)]/85' : 'border-white/20',
                  ].join(' ')}
                >
                  <div className="flex h-5 items-center">
                    {dotPriority ? (
                      <span
                        aria-hidden="true"
                        title={`${dotPriority} priority`}
                        className={['h-1.5 w-1.5 rounded-full', dotClass].join(' ')}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}
