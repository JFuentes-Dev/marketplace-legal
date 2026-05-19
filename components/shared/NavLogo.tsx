// components/shared/NavLogo.tsx
import Link from 'next/link'

export function NavLogo() {
  return (
    <Link
      href="/"
      style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Monograma con corner-ticks */}
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          border: '1px solid rgba(201,163,90,0.5)',
          flexShrink: 0,
        }}
      >
        {/* Corner ticks */}
        <span style={{ position: 'absolute', top: -3,  left: -3,  width: 6, height: 6, borderTop: '2px solid var(--dls-champagne)', borderLeft: '2px solid var(--dls-champagne)' }} />
        <span style={{ position: 'absolute', top: -3,  right: -3, width: 6, height: 6, borderTop: '2px solid var(--dls-champagne)', borderRight: '2px solid var(--dls-champagne)' }} />
        <span style={{ position: 'absolute', bottom: -3, left: -3,  width: 6, height: 6, borderBottom: '2px solid var(--dls-champagne)', borderLeft: '2px solid var(--dls-champagne)' }} />
        <span style={{ position: 'absolute', bottom: -3, right: -3, width: 6, height: 6, borderBottom: '2px solid var(--dls-champagne)', borderRight: '2px solid var(--dls-champagne)' }} />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--dls-champagne)',
            letterSpacing: '0.08em',
            lineHeight: 1,
          }}
        >
          ML
        </span>
      </div>

      {/* Wordmark */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 17,
            color: 'var(--dls-cream)',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          Marketplace{' '}
          <em style={{ color: 'var(--dls-champagne)', fontStyle: 'italic' }}>&</em>{' '}
          Legal
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 8,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(250,244,237,0.4)',
            marginTop: 1,
          }}
        >
          Chile · Verified
        </div>
      </div>
    </Link>
  )
}