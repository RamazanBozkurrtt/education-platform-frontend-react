import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/helpers'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const Card = ({ children, className, ...props }: CardProps) => (
  <div
    className={cn(
      'glass-panel theme-text rounded-[22px] border border-white/8 p-6 transition-all duration-300 hover:border-white/14',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

export default Card
