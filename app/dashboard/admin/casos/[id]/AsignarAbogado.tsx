"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Abogado {
  id: string
  nombre: string
  especialidades: string[]
}

interface Props {
  casoId: string
  abogadoActualId: string | null
  abogados: Abogado[]
}

export default function AsignarAbogado({ casoId, abogadoActualId, abogados }: Props) {
  const router = useRouter()
  const [seleccionado, setSeleccionado] = useState(abogadoActualId ?? "")
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAsignar() {
    if (!seleccionado) return
    setLoading(true)
    setMensaje(null)
    setError(null)

    const res = await fetch("/api/admin/asignar-abogado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caso_id: casoId, abogado_id: seleccionado }),
    })

    setLoading(false)

    if (!res.ok) {
      setError("No se pudo asignar el abogado. Intenta nuevamente.")
      return
    }

    setMensaje("Abogado asignado correctamente.")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <select
        value={seleccionado}
        onChange={(e) => setSeleccionado(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
      >
        <option value="">Selecciona un abogado</option>
        {abogados.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
            {a.especialidades.length > 0 ? ` · ${a.especialidades.slice(0, 2).join(", ")}` : ""}
          </option>
        ))}
      </select>

      {mensaje && <p className="text-sm text-green-600">{mensaje}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        onClick={handleAsignar}
        disabled={loading || !seleccionado}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Asignando..." : "Asignar abogado"}
      </button>
    </div>
  )
}