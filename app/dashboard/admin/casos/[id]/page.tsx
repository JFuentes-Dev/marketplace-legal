// app/dashboard/admin/casos/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import AsignarAbogado from './AsignarAbogado'
import AceptarPostulacion from './AceptarPostulacion'
import { EstadoBadge } from '@/components/casos/EstadoBadge'
import type { EstadoCaso } from '@/lib/types/caso'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DetalleCasoAdmin({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminClient = createAdminClient()

  const { data: caso } = await adminClient
    .from('casos')
    .select('id, titulo, descripcion, area_legal, estado, created_at, abogado_id, cliente_id, postulaciones_count')
    .eq('id', id)
    .single()

  if (!caso) notFound()

  const { data: cliente } = await adminClient
    .from('profiles')
    .select('nombre, apellido, email')
    .eq('id', caso.cliente_id)
    .single()

  // Postulaciones del caso (solo si está pendiente sin abogado)
  const { data: postulacionesRaw } = await adminClient
    .from('postulaciones')
    .select(`
      id, abogado_id, mensaje, estado, created_at,
      profiles!postulaciones_abogado_id_fkey(nombre, apellido),
      lawyer_profiles!postulaciones_abogado_id_fkey(especialidades)
    `)
    .eq('caso_id', id)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })

  const postulaciones = (postulacionesRaw ?? []).map((p) => {
    const perfil = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
    const lp = Array.isArray(p.lawyer_profiles) ? p.lawyer_profiles[0] : p.lawyer_profiles
    return {
      id: p.id,
      abogado_id: p.abogado_id,
      nombre: perfil?.nombre ?? '',
      apellido: perfil?.apellido ?? '',
      especialidades: (lp?.especialidades as string[]) ?? [],
      mensaje: p.mensaje,
      created_at: p.created_at,
    }
  })

  // Abogados para asignación manual
  const { data: abogados } = await adminClient
    .from('lawyer_profiles')
    .select('id, especialidades, profiles(nombre, apellido)')
    .eq('verified', true)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* Volver */}
      <Link
        href="/dashboard/admin"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--dls-taupe)',
          textDecoration: 'none',
          marginBottom: 28,
        }}
      >
        ← Volver al panel
      </Link>

      {/* Header del caso */}
      <div
        style={{
          background: 'var(--dls-white)',
          border: '1px solid var(--dls-hairline)',
          padding: '28px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 26, color: 'var(--dls-navy)', lineHeight: 1.2 }}>
            {caso.titulo}
          </h1>
          <EstadoBadge estado={caso.estado as EstadoCaso} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 4 }}>Área</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-navy)' }}>{caso.area_legal}</p>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 4 }}>Creado</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-navy)' }}>
              {new Date(caso.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 4 }}>Cliente</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-navy)' }}>
              {cliente?.nombre} {cliente?.apellido} · {cliente?.email}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 4 }}>Postulaciones</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-navy)' }}>
              {caso.postulaciones_count ?? 0} / 3
            </p>
          </div>
        </div>

        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 8 }}>Descripción</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.75, color: 'var(--dls-navy-mid)' }}>{caso.descripcion}</p>
        </div>
      </div>

      {/* Postulaciones del pool */}
      {caso.estado === 'pendiente' && !caso.abogado_id && (
        <div
          style={{
            background: 'var(--dls-white)',
            border: '1px solid var(--dls-hairline)',
            padding: '28px',
            marginBottom: 20,
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--dls-navy)' }}>Postulaciones recibidas</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 20, color: 'var(--dls-navy)', marginBottom: 20 }}>
            Abogados interesados
          </h2>
          <AceptarPostulacion casoId={caso.id} postulaciones={postulaciones} />
        </div>
      )}

      {/* Asignación manual */}
      <div
        style={{
          background: 'var(--dls-white)',
          border: '1px solid var(--dls-hairline)',
          padding: '28px',
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--dls-navy)' }}>Asignación manual</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 20, color: 'var(--dls-navy)', marginBottom: 20 }}>
          Asignar abogado directamente
        </h2>
        <AsignarAbogado
          casoId={caso.id}
          abogadoActualId={caso.abogado_id}
          abogados={(abogados ?? []).map((a) => {
            const perfil = a.profiles as { nombre: string; apellido: string } | { nombre: string; apellido: string }[] | null
            const p = Array.isArray(perfil) ? perfil[0] : perfil
            return {
              id: a.id,
              nombre: `${p?.nombre ?? ''} ${p?.apellido ?? ''}`.trim(),
              especialidades: (a.especialidades as string[]) ?? [],
            }
          })}
        />
      </div>
    </div>
  )
}