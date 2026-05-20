import type { ReactNode } from 'react'
import { cn } from '../../utils/helpers'

interface TableShellProps {
  children: ReactNode
  className?: string
}

const TableShell = ({ children, className }: TableShellProps) => (
  <div className={cn('overflow-x-auto rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]', className)}>
    {children}
  </div>
)

export default TableShell
