// components/ui/button.tsx
// Compatible con el uso existente — soporte para variant y size
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    background: 'var(--dls-navy)',
    color: 'var(--dls-cream)',
    border: 'none',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background 0.25s',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--dls-navy)',
    border: 'none',
    borderBottom: '1px solid var(--dls-champagne)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: 10,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  destructive: {
    background: 'var(--dls-burgundy)',
    color: 'var(--dls-cream)',
    border: 'none',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--dls-navy)',
    border: 'none',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  outline: {
    background: 'transparent',
    color: 'var(--dls-navy)',
    border: '1px solid var(--dls-hairline)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
}

const sizeStyles: Record<string, React.CSSProperties> = {
  default: { padding: '12px 24px' },
  sm:      { padding: '8px 16px', fontSize: 9 },
  lg:      { padding: '14px 32px', fontSize: 11 },
  icon:    { padding: '10px', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}

export function Button({
  variant = 'default',
  size = 'default',
  children,
  style,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...variantStyles[variant],
    ...sizeStyles[size],
    opacity: disabled ? 0.6 : 1,
    ...style,
  }

  return (
    <button style={base} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

export default Button