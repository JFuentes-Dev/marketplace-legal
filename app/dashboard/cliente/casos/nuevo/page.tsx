"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"

const AREAS_LEGALES = [
  "Derecho de Familia",
  "Derecho Laboral",
  "Derecho Civil",
  "Derecho Penal",
  "Derecho Comercial",
  "Derecho Inmobiliario",
  "Derecho Tributario",
  "Otro",
]

const casoSchema = z.object({
  titulo: z.string().min(5, "Mínimo 5 caracteres"),
  descripcion: z.string().min(20, "Describe tu caso con al menos 20 caracteres"),
  area_legal: z.string().min(1, "Selecciona un área legal"),
})

export default function NuevoCaso() {
  const router = useRouter()
  const [form, setForm] = useState({ titulo: "", descripcion: "", area_legal: "" })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrores((prev) => ({ ...prev, [e.target.name]: "" }))
  }

  async function handleSubmit(e: React.MouseEvent) {
    e.preventDefault()
    setError(null)

    const result = casoSchema.safeParse(form)
    if (!result.success) {
      const map: Record<string, string> = {}
      result.error.issues.forEach((i) => { map[i.path[0] as string] = i.message })
      setErrores(map)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { router.push("/login"); return }

    const { error: dbError } = await supabase.from("casos").insert({
      cliente_id: user.id,
      titulo: result.data.titulo,
      descripcion: result.data.descripcion,
      area_legal: result.data.area_legal,
    })

    setLoading(false)

    if (dbError) {
      setError("No se pudo crear el caso. Intenta nuevamente.")
      return
    }

    router.push("/dashboard/cliente")
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo caso</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe tu situación y un abogado será asignado pronto.
        </p>
      </div>

      <div className="space-y-4">
        {/* Título */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Título del caso</label>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            placeholder="Ej: Despido injustificado en empresa X"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errores.titulo && <p className="text-xs text-destructive">{errores.titulo}</p>}
        </div>

        {/* Área legal */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Área legal</label>
          <select
            name="area_legal"
            value={form.area_legal}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          >
            <option value="">Selecciona un área</option>
            {AREAS_LEGALES.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          {errores.area_legal && <p className="text-xs text-destructive">{errores.area_legal}</p>}
        </div>

        {/* Descripción */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows={5}
            placeholder="Explica tu situación con el mayor detalle posible..."
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          {errores.descripcion && <p className="text-xs text-destructive">{errores.descripcion}</p>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Crear caso"}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}