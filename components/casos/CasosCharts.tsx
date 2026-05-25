'use client'

import { useState } from 'react'

interface ChartData {
  estado: string
  label: string
  count: number
  color: string
  macro: 'asignado' | 'en_curso' | 'cerrado'
}

interface Props {
  data: ChartData[]
  totalCasos: number
}

function DonutChart({ data, total }: { data: ChartData[]; total: number }) {
  const size = 180
  const cx = size / 2
  const cy = size / 2
  const R = 72
  const r = 44
  const [hovered, setHovered] = useState<string | null>(null)

  if (total === 0) return null

  const activeSlices = data.filter(d => d.count > 0)
  const hoveredRaw = hovered ? activeSlices.find(s => s.estado === hovered) : null
  const activeSlice = hoveredRaw ? { ...hoveredRaw, pct: Math.round((hoveredRaw.count / total) * 100) } : null

  // Caso especial: un solo sector = círculo completo, no arco
  const isSingle = activeSlices.length === 1

  type Slice = { d: string; color: string; label: string; count: number; estado: string; pct: number }
  const slices: Slice[] = []

  if (!isSingle) {
    let startAngle = -Math.PI / 2
    for (const item of activeSlices) {
      const angle = (item.count / total) * 2 * Math.PI
      const endAngle = startAngle + angle
      const x1 = cx + R * Math.cos(startAngle)
      const y1 = cy + R * Math.sin(startAngle)
      const x2 = cx + R * Math.cos(endAngle)
      const y2 = cy + R * Math.sin(endAngle)
      const ix1 = cx + r * Math.cos(endAngle)
      const iy1 = cy + r * Math.sin(endAngle)
      const ix2 = cx + r * Math.cos(startAngle)
      const iy2 = cy + r * Math.sin(startAngle)
      const large = angle > Math.PI ? 1 : 0
      const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${large} 0 ${ix2} ${iy2} Z`
      slices.push({ d, color: item.color, label: item.label, count: item.count, estado: item.estado, pct: Math.round((item.count / total) * 100) })
      startAngle = endAngle
    }
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {isSingle ? (
          // Un solo sector: dos círculos concéntricos
          <>
            <circle
              cx={cx} cy={cy} r={R}
              fill={activeSlices[0].color}
              opacity={hovered && hovered !== activeSlices[0].estado ? 0.35 : 1}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHovered(activeSlices[0].estado)}
              onMouseLeave={() => setHovered(null)}
            />
          </>
        ) : (
          slices.map((slice) => {
            const isHovered = hovered === slice.estado
            return (
              <path
                key={slice.estado}
                d={slice.d}
                fill={slice.color}
                opacity={hovered && !isHovered ? 0.35 : 1}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={() => setHovered(slice.estado)}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })
        )}
        {/* Hueco central */}
        <circle cx={cx} cy={cy} r={r - 2} fill="var(--dls-white)" style={{ pointerEvents: 'none' }} />
        {/* Texto centro */}
        {activeSlice ? (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--dls-navy)" fontSize="22" fontWeight="600">
              {activeSlice.count}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--dls-taupe)" fontSize="9" style={{ letterSpacing: '0.08em' }}>
              {activeSlice.pct}%
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--dls-navy)" fontSize="22" fontWeight="600">
              {total}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--dls-taupe)" fontSize="9" style={{ letterSpacing: '0.1em' }}>
              CASOS
            </text>
          </>
        )}
      </svg>
    </div>
  )
}

export function CasosCharts({ data, totalCasos }: Props) {
  if (totalCasos === 0) return null

  const activeData = data.filter(d => d.count > 0)

  const macroGroups = [
    { label: 'Asignado', macro: 'asignado' as const, color: '#2a3a5c', count: data.filter(d => d.macro === 'asignado').reduce((s, d) => s + d.count, 0) },
    { label: 'En curso', macro: 'en_curso' as const,  color: '#4f46e5', count: data.filter(d => d.macro === 'en_curso').reduce((s, d) => s + d.count, 0) },
    { label: 'Cerrado',  macro: 'cerrado' as const,   color: '#9ca3af', count: data.filter(d => d.macro === 'cerrado').reduce((s, d) => s + d.count, 0) },
  ].map(g => ({ ...g, estado: g.macro, pct: Math.round((g.count / totalCasos) * 100) }))

  const enCursoData = activeData.filter(d => d.macro === 'en_curso')
  const enCursoTotal = enCursoData.reduce((s, d) => s + d.count, 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>

      {/* Card 1: Donut macro */}
      <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px 32px' }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>Distribución general</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <DonutChart
            data={macroGroups.map(g => ({ estado: g.estado, label: g.label, count: g.count, color: g.color, macro: g.macro }))}
            total={totalCasos}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {macroGroups.filter(g => g.count > 0).map(g => (
              <div key={g.macro}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-navy)' }}>{g.label}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600, color: 'var(--dls-navy)' }}>{g.count}</span>
                </div>
                <div style={{ height: 3, background: 'var(--dls-hairline)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${g.pct}%`, background: g.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 2: Detalle en curso */}
      <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px 32px' }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>Detalle — en curso</div>
        {enCursoData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--dls-taupe)' }}>
              Sin casos en curso
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <DonutChart data={enCursoData} total={enCursoTotal} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {enCursoData.map(item => (
                <div key={item.estado}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-navy)', lineHeight: 1.3 }}>{item.label}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: 'var(--dls-navy)', flexShrink: 0, marginLeft: 8 }}>{item.count}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--dls-hairline)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${Math.round((item.count / enCursoTotal) * 100)}%`, background: item.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}