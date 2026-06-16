'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StarRating } from '@/components/ui/star-rating'

interface Props {
  id: string
  nombre: string
  apellido: string
  avatarUrl?: string | null
  especialidades: string[]
  bio?: string | null
  tarifaHora?: number | null
  yearsExperiencia?: number | null
  rating?: { promedio: number; total: number }
}

export function AbogadoCard({
  id,
  nombre,
  apellido,
  avatarUrl,
  especialidades,
  bio,
  tarifaHora,
  yearsExperiencia,
  rating,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const iniciales = `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`

  return (
    <Link
      href={`/abogados/${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        background: 'var(--dls-white)',
        border: `1px solid ${hovered ? 'var(--dls-champagne)' : 'var(--dls-hairline)'}`,
        padding: '28px',
        textDecoration: 'none',
        position: 'relative',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 40px -8px rgba(15,30,58,0.14)'
          : '0 2px 8px -2px rgba(15,30,58,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Barra superior champagne en hover */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, var(--dls-champagne), rgba(201,163,90,0.4))',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      />

      {/* Avatar + nombre */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: hovered ? 'var(--dls-navy)' : 'rgba(15,30,58,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
            overflow: 'hidden',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={iniciales} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 18,
                color: hovered ? 'var(--dls-champagne)' : 'var(--dls-navy)',
                transition: 'color 0.2s',
                lineHeight: 1,
              }}
            >
              {iniciales}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 20,
              color: 'var(--dls-navy)',
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            {nombre} {apellido}
          </h2>

          {rating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StarRating value={Math.round(rating.promedio)} readonly size="sm" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)' }}>
                ({rating.total})
              </span>
            </div>
          ) : (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)', letterSpacing: '0.04em' }}>
              Sin valoraciones aún
            </span>
          )}
        </div>
      </div>

      {/* Especialidades */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
        {(especialidades ?? []).slice(0, 3).map((e) => (
          <span
            key={e}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: hovered ? 'var(--dls-champagne)' : 'var(--dls-navy-mid)',
              background: hovered ? 'rgba(201,163,90,0.1)' : 'rgba(15,30,58,0.06)',
              padding: '4px 10px',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {e}
          </span>
        ))}
        {especialidades.length > 3 && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--dls-taupe)', padding: '4px 2px' }}>
            +{especialidades.length - 3}
          </span>
        )}
      </div>

      {/* Bio en hover */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: hovered ? 80 : 0,
          opacity: hovered ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
          marginTop: hovered ? 14 : 0,
        }}
      >
        {bio && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: 1.65,
              color: 'var(--dls-taupe)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {bio}
          </p>
        )}
      </div>

      {/* Footer: experiencia + tarifa + CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--dls-hairline)',
        }}
      >
        <div>
          {yearsExperiencia != null && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)' }}>
              {yearsExperiencia} año{yearsExperiencia !== 1 ? 's' : ''} exp.
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {tarifaHora != null && (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 16,
                color: hovered ? 'var(--dls-champagne)' : 'var(--dls-navy)',
                transition: 'color 0.2s',
              }}
            >
              ${tarifaHora.toLocaleString('es-CL')}/hr
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              letterSpacing: '0.06em',
              color: hovered ? 'var(--dls-champagne)' : 'var(--dls-taupe)',
              transition: 'color 0.2s',
              textTransform: 'uppercase',
            }}
          >
            Ver perfil →
          </span>
        </div>
      </div>
    </Link>
  )
}