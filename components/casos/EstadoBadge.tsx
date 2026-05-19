// components/casos/EstadoBadge.tsx
import React from 'react'

type Estado = 'pendiente' | 'asignado' | 'en_progreso' | 'cerrado'

const config: Record<Estado, { label: string; bg: string; color: string; dot: string }> = {
  pendiente:   { label: 'Pendiente',   bg: 'rgba(201,163,90,0.12)',  color: 'var(--dls-champagne)', dot: 'var(--dls-champagne)' },
  asignado:    { label: 'Asignado',    bg: 'rgba(42,58,92,0.08)',    color: 'var(--dls-navy-mid)',  dot: 'var(--dls-navy-mid)' },
  en_progreso: { label: 'En progreso', bg: 'rgba(74,222,128,0.1)',   color: '#16a34a',              dot: '#4ade80' },
  cerrado:     { label: 'Cerrado',     bg: 'rgba(122,42,56,0.1)',    color: 'var(--dls-burgundy)',  dot: 'var(--dls-burgundy)' },
}

interface Props {
  estado: string
}

export function EstadoBadge({ estado }: Props) {
  const cfg = config[estado as Estado] ?? {
    label: estado,
    bg: 'rgba(166,143,133,0.1)',
    color: 'var(--dls-taupe)',
    dot: 'var(--dls-taupe)',
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        background: cfg.bg,
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: cfg.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  )
}