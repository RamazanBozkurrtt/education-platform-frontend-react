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
    'bg-sky-600 text-white shadow-sm shadow-sky-950/10 hover:bg-sky-500',
  secondary:
    'border border-white/12 bg-white/6 text-slate-100 hover:border-white/20 hover:bg-white/10',
  ghost: 'bg-transparent text-slate-300 hover:bg-white/6 hover:text-white',
}

const sizes = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
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
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:cursor-not-allowed disabled:opacity-60',
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
