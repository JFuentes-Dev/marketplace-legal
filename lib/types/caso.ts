export type EstadoCaso =
  | 'pendiente'
  | 'asignado'
  | 'proxima_audiencia'
  | 'proxima_mediacion'
  | 'espera_notificacion'
  | 'pendiente_documentos'
  | 'en_negociacion'
  | 'recurso_presentado'
  | 'sentencia_dictada'
  | 'apelacion'
  | 'cerrado'

export const ESTADO_LABELS: Record<EstadoCaso, string> = {
  pendiente:            'Pendiente',
  asignado:             'Asignado',
  proxima_audiencia:    'Próxima audiencia',
  proxima_mediacion:    'Próxima mediación',
  espera_notificacion:  'A la espera de notificación',
  pendiente_documentos: 'Pendiente de documentos',
  en_negociacion:       'En negociación',
  recurso_presentado:   'Recurso presentado',
  sentencia_dictada:    'Sentencia dictada',
  apelacion:            'Apelación',
  cerrado:              'Cerrado',
}

export const ESTADO_COLORS: Record<EstadoCaso, { bg: string; color: string; dot: string }> = {
  pendiente:            { bg: 'rgba(201,163,90,0.12)',  color: 'var(--dls-champagne)', dot: 'var(--dls-champagne)' },
  asignado:             { bg: 'rgba(42,58,92,0.08)',    color: 'var(--dls-navy-mid)',  dot: 'var(--dls-navy-mid)' },
  proxima_audiencia:    { bg: 'rgba(99,102,241,0.12)',  color: '#4f46e5',              dot: '#4f46e5' },
  proxima_mediacion:    { bg: 'rgba(139,92,246,0.12)',  color: '#7c3aed',              dot: '#7c3aed' },
  espera_notificacion:  { bg: 'rgba(245,158,11,0.12)', color: '#b45309',              dot: '#f59e0b' },
  pendiente_documentos: { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626',              dot: '#ef4444' },
  en_negociacion:       { bg: 'rgba(16,185,129,0.12)', color: '#059669',              dot: '#10b981' },
  recurso_presentado:   { bg: 'rgba(6,182,212,0.12)',  color: '#0e7490',              dot: '#06b6d4' },
  sentencia_dictada:    { bg: 'rgba(34,197,94,0.12)',  color: '#15803d',              dot: '#22c55e' },
  apelacion:            { bg: 'rgba(249,115,22,0.12)', color: '#c2410c',              dot: '#f97316' },
  cerrado:              { bg: 'rgba(107,114,128,0.12)', color: '#6b7280',             dot: '#9ca3af' },
}

// Estados que solo puede asignar el abogado (después de recibir el caso)
export const ESTADOS_ABOGADO: EstadoCaso[] = [
  'proxima_audiencia',
  'proxima_mediacion',
  'espera_notificacion',
  'pendiente_documentos',
  'en_negociacion',
  'recurso_presentado',
  'sentencia_dictada',
  'apelacion',
  'cerrado',
]

export interface Caso {
  id: string
  cliente_id: string
  abogado_id: string | null
  titulo: string
  descripcion: string
  area_legal: string
  estado: EstadoCaso
  created_at: string
  updated_at: string
}

export interface Mensaje {
  id: string
  caso_id: string
  autor_id: string
  contenido: string
  adjunto_url: string | null
  adjunto_nombre: string | null
  adjunto_tipo: string | null
  created_at: string
}

export interface Review {
  id: string
  caso_id: string
  cliente_id: string
  abogado_id: string
  puntuacion: number
  comentario: string | null
  created_at: string
}

export interface MensajeNoLeido {
  caso_id: string
  count: number
}