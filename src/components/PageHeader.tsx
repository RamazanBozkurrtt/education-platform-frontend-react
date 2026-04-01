import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

const PageHeader = ({ actions, description, eyebrow, title }: PageHeaderProps) => (
  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-2xl">
      {eyebrow ? (
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-400 md:text-base">{description}</p>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
  </div>
)

export default PageHeader
