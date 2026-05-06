import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../utils/helpers'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

const variants = {
  primary:
    'border border-[color:var(--primary)] bg-[color:var(--primary)] text-white shadow-sm shadow-slate-900/10 hover:border-[color:var(--primary-strong)] hover:bg-[color:var(--primary-strong)]',
  secondary:
    'border border-white/12 bg-[color:var(--surface-muted)] text-slate-100 hover:border-white/18 hover:bg-[color:var(--surface-hover)]',
  ghost: 'bg-transparent text-slate-400 hover:bg-[color:var(--surface-muted)] hover:text-slate-100',
}

const lightVariants = {
  primary:
    'border border-slate-200/90 bg-slate-100/55 text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:border-slate-300 hover:bg-slate-200/75',
  secondary:
    'border border-slate-200/90 bg-white/80 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:bg-slate-100/85',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100/80 hover:text-slate-950',
}

const sizes = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-10 px-4.5 text-sm',
  lg: 'h-11 px-5 text-base',
}

const Button = ({
  asChild = false,
  children,
  className,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) => {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:cursor-not-allowed disabled:opacity-60',
    isLight ? lightVariants[variant] : variants[variant],
    sizes[size],
    className,
  )

  if (asChild) {
    return <span className={classes}>{children}</span>
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  )
}

export default Button
