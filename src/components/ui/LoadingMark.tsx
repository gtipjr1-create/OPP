import { OppMark } from '@/components/OppMark';

type LoadingMarkProps = {
  label?: string;
  size?: number;
  className?: string;
};

export default function LoadingMark({
  label = 'Loading',
  size = 32,
  className = '',
}: LoadingMarkProps) {
  return (
    <div className={['flex flex-col items-center justify-center gap-3', className].filter(Boolean).join(' ')}>
      <OppMark size={size} />
      <p className="text-meta font-mono tracking-wide text-text-secondary">{label}</p>
    </div>
  );
}
