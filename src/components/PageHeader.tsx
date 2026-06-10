import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

const PageHeader = ({ actions, description, eyebrow, title }: PageHeaderProps) => (
  <div className="theme-surface-strong flex flex-col gap-6 rounded-[var(--radius-cards)] border border-[color:var(--border)] p-[var(--card-padding)] shadow-[var(--shadow-sm)] lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl space-y-3">
      {eyebrow ? (
        <span className="theme-muted inline-flex rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-[11px] font-semibold tracking-[0.12em]">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="theme-heading text-3xl font-semibold tracking-tight md:text-[2.15rem]">
        {title}
      </h1>
      <p className="theme-muted max-w-2xl text-sm leading-6">{description}</p>
    </div>
    {actions ? <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">{actions}</div> : null}
  </div>
)

export default PageHeader
