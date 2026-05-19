'use client'

// components/casos/UploadDocumento.tsx

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { uploadDocumento } from '@/app/dashboard/cliente/casos/[id]/actions'

interface Props {
  casoId: string
  cerrado?: boolean
}

const EXTENSIONES_LABEL = 'PDF, Word, Excel, JPG, PNG · Máx. 10 MB'

type Estado = 'idle' | 'loading' | 'success' | 'error'

export function UploadDocumento({ casoId, cerrado }: Props) {
  const [file, setFile]         = useState<File | null>(null)
  const [estado, setEstado]     = useState<Estado>('idle')
  const [mensaje, setMensaje]   = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef                = useRef<HTMLInputElement>(null)
  const router                  = useRouter()

  if (cerrado) return null

  // ── Helpers ──────────────────────────────────────────────

  function seleccionarArchivo(f: File) {
    setFile(f)
    setEstado('idle')
    setMensaje(null)
  }

  function limpiar() {
    setFile(null)
    setEstado('idle')
    setMensaje(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleSubir() {
    if (!file) return
    setEstado('loading')
    setMensaje(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      await uploadDocumento(casoId, formData)
      setEstado('success')
      setMensaje('Documento subido correctamente')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      router.refresh() // re-fetcha la lista desde el server component
    } catch (e: unknown) {
      setEstado('error')
      setMensaje(e instanceof Error ? e.message : 'Error desconocido')
    }
  }

  // ── Drag & Drop ──────────────────────────────────────────

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) seleccionarArchivo(dropped)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        Subir documento
      </p>

      {/* Zona drag & drop */}
      {!file && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2
            border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer
            transition-all duration-200
            ${dragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
          `}
        >
          <Upload className={`w-7 h-7 transition-colors ${dragging ? 'text-blue-500' : 'text-gray-300'}`} />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              Arrastra un archivo o{' '}
              <span className="text-blue-600 underline underline-offset-2">selecciona desde tu equipo</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{EXTENSIONES_LABEL}</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) seleccionarArchivo(f)
            }}
          />
        </div>
      )}

      {/* Archivo seleccionado */}
      {file && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-100 bg-blue-50">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          {estado !== 'loading' && (
            <button
              onClick={limpiar}
              className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Quitar archivo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Feedback estado */}
      {mensaje && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2
          ${estado === 'error'
            ? 'bg-red-50 text-red-600 border border-red-100'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}
        `}>
          {estado === 'error'
            ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
            : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {mensaje}
        </div>
      )}

      {/* Botón subir */}
      {file && (
        <button
          onClick={handleSubir}
          disabled={estado === 'loading'}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0f1f3d] text-white text-sm font-medium rounded-xl hover:bg-[#1a3260] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {estado === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Subir documento
            </>
          )}
        </button>
      )}
    </div>
  )
}