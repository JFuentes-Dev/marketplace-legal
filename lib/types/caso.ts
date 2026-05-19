export type EstadoCaso = 'pendiente' | 'asignado' | 'en_progreso' | 'cerrado'

export const ESTADO_LABELS: Record<EstadoCaso, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  en_progreso: 'En progreso',
  cerrado: 'Cerrado',
}

export const ESTADO_COLORS: Record<EstadoCaso, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  asignado: 'bg-blue-100 text-blue-700 border-blue-200',
  en_progreso: 'bg-purple-100 text-purple-700 border-purple-200',
  cerrado: 'bg-gray-100 text-gray-500 border-gray-200',
}

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