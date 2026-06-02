import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/helpers'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const Card = ({ children, className, ...props }: CardProps) => (
  <div
    className={cn(
      'theme-surface-strong theme-text rounded-[var(--radius-cards)] border border-[color:var(--border)] p-[var(--card-padding)] shadow-none',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

export default Card
