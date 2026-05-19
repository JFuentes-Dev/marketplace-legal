// components/casos/MensajesPanel.tsx
'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subirAdjunto } from '@/lib/supabase/storage'
import type { Mensaje } from '@/lib/types/caso'

interface MensajesPanelProps {
  casoId: string
  userId: string
  cerrado: boolean
}

export function MensajesPanel({ casoId, userId, cerrado }: MensajesPanelProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [contenido, setContenido] = useState('')
  const [adjunto, setAdjunto] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const cargarMensajes = useCallback(async () => {
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .eq('caso_id', casoId)
      .order('created_at', { ascending: true })

    if (data) setMensajes(data as Mensaje[])

    // Marcar como leídos
    if (data && data.length > 0) {
      const mensajesAjenos = data.filter((m) => m.autor_id !== userId)
      if (mensajesAjenos.length > 0) {
        await supabase.from('mensaje_lecturas').upsert(
          mensajesAjenos.map((m) => ({
            mensaje_id: m.id,
            user_id: userId,
          })),
          { onConflict: 'mensaje_id,user_id', ignoreDuplicates: true }
        )
      }
    }
  }, [casoId, userId, supabase])

  useEffect(() => {
    cargarMensajes()

    const channel = supabase
      .channel(`mensajes-${casoId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `caso_id=eq.${casoId}`,
      }, () => cargarMensajes())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [casoId, cargarMensajes, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviar = async () => {
    if (!contenido.trim() && !adjunto) return
    setEnviando(true)

    let adjuntoData: { url: string; nombre: string; tipo: string } | null = null

    if (adjunto) {
      setSubiendoArchivo(true)
      adjuntoData = await subirAdjunto(adjunto, casoId)
      setSubiendoArchivo(false)
    }

    await supabase.from('mensajes').insert({
      caso_id: casoId,
      autor_id: userId,
      contenido: contenido.trim(),
      adjunto_url: adjuntoData?.url ?? null,
      adjunto_nombre: adjuntoData?.nombre ?? null,
      adjunto_tipo: adjuntoData?.tipo ?? null,
    })

    // Notificar por email (fire and forget)
    fetch('/api/mensajes/notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ casoId, autorId: userId }),
    }).catch(() => {})

    setContenido('')
    setAdjunto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setEnviando(false)
  }

  const esPropio = (autorId: string) => autorId === userId

  const renderAdjunto = (msg: Mensaje) => {
    if (!msg.adjunto_url) return null
    const esImagen = msg.adjunto_tipo?.startsWith('image/')
    if (esImagen) {
      return (
        <a href={msg.adjunto_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={msg.adjunto_url}
            alt={msg.adjunto_nombre ?? 'imagen'}
            className="max-w-[200px] rounded-md border"
          />
        </a>
      )
    }
    return (
      <a
        href={msg.adjunto_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 mt-1 text-xs underline opacity-80"
      >
        📎 {msg.adjunto_nombre}
      </a>
    )
  }

  return (
    <div className="flex flex-col h-[500px] border border-gray-200 rounded-lg overflow-hidden">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {mensajes.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            No hay mensajes aún. ¡Inicia la conversación!
          </p>
        )}
        {mensajes.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${esPropio(msg.autor_id) ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                esPropio(msg.autor_id)
                  ? 'bg-blue-700 text-white rounded-br-none'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
              }`}
            >
              {msg.contenido && <p>{msg.contenido}</p>}
              {renderAdjunto(msg)}
              <p className={`text-xs mt-1 ${esPropio(msg.autor_id) ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!cerrado ? (
        <div className="border-t border-gray-200 bg-white p-3 space-y-2">
          {adjunto && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-md px-3 py-1 text-sm">
              <span>📎 {adjunto.name}</span>
              <button onClick={() => setAdjunto(null)} className="text-red-500 hover:text-red-700 ml-auto text-xs">
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => setAdjunto(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              title="Adjuntar archivo"
            >
              📎
            </button>
            <input
              type="text"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviar()}
              placeholder="Escribe un mensaje..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={enviar}
              disabled={enviando || subiendoArchivo || (!contenido.trim() && !adjunto)}
              className="bg-blue-700 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {subiendoArchivo ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-200 bg-gray-50 p-3 text-center text-sm text-gray-500">
          Este caso está cerrado. No se pueden enviar más mensajes.
        </div>
      )}
    </div>
  )
}