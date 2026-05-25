// components/casos/EstadoBadge.tsx
import React from 'react'
import { ESTADO_COLORS, ESTADO_LABELS, ESTADOS_ABOGADO, type EstadoCaso } from '@/lib/types/caso'

interface Props {
  estado: string
  /** Si true, colapsa todos los estados intermedios a "En curso" */
  macro?: boolean
}

// Cast a string[] para evitar conflictos de narrowing con includes()
const ESTADOS_INTERMEDIOS: string[] = ESTADOS_ABOGADO.filter(e => e !== 'cerrado')

export function EstadoBadge({ estado, macro = false }: Props) {
  const estadoCast = estado as EstadoCaso
  const esIntermedio = ESTADOS_INTERMEDIOS.includes(estado)

  const cfg = ESTADO_COLORS[estadoCast] ?? {
    bg: 'rgba(166,143,133,0.1)',
    color: 'var(--dls-taupe)',
    dot: 'var(--dls-taupe)',
  }

  // En modo macro, estados intermedios muestran color de proxima_audiencia (azul índigo)
  // y label "En curso"
  const cfgMacro = macro && esIntermedio
    ? ESTADO_COLORS['proxima_audiencia']
    : cfg

  const label = macro && esIntermedio
    ? 'En curso'
    : (ESTADO_LABELS[estadoCast] ?? estado)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        background: cfgMacro.bg,
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: cfgMacro.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfgMacro.dot,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  )
}