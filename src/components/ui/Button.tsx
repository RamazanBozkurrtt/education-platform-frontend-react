import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/helpers'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

const variants = {
  primary:
    'border border-[color:var(--primary)] bg-[color:var(--primary)] text-white hover:border-[color:var(--primary-strong)] hover:bg-[color:var(--primary-strong)]',
  secondary:
    'border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--text-heading)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]',
  ghost: 'border border-transparent bg-transparent text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-heading)]',
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
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-buttons)] font-semibold shadow-none transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] disabled:cursor-not-allowed disabled:opacity-45',
    variants[variant],
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
