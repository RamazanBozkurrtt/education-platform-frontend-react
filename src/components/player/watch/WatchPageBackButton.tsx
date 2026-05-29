import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../../utils/helpers'

interface WatchPageBackButtonProps {
  to: string
  label: string
  className?: string
}

const WatchPageBackButton = ({ className, label, to }: WatchPageBackButtonProps) => (
  <Link
    className={cn(
      'inline-flex items-center gap-2 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-medium text-[color:var(--text-heading)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]',
      className,
    )}
    to={to}
  >
    <ArrowLeft className="h-4 w-4" />
    <span>{label}</span>
  </Link>
)

export default WatchPageBackButton
