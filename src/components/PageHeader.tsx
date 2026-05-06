import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

const PageHeader = ({ actions, description, eyebrow, title }: PageHeaderProps) => (
  <div className="glass-panel flex flex-col gap-6 rounded-lg border border-white/10 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-7">
    <div className="max-w-3xl">
      {eyebrow ? (
        <span className="inline-flex rounded-md border border-white/10 bg-[color:var(--surface-muted)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-[2.4rem]">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{description}</p>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
  </div>
)

export default PageHeader
