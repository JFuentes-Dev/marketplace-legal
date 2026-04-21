"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ESPECIALIDADES = [
  "Derecho Civil",
  "Derecho Penal",
  "Derecho de Familia",
  "Derecho Laboral",
  "Derecho Comercial",
  "Derecho Tributario",
  "Derecho Inmobiliario",
  "Derecho Migratorio",
]

const esquema = z.object({
  rut: z.string().min(1, "El RUT es obligatorio"),
  numero_colegio: z.string().min(1, "El N° de colegio es obligatorio"),
  bio: z.string().min(20, "La biografía debe tener al menos 20 caracteres"),
  tarifa_hora: z.coerce.number().positive("La tarifa debe ser mayor a 0"),
  years_experiencia: z.coerce.number().min(0, "Valor inválido"),
  especialidades: z.array(z.string()).min(1, "Selecciona al menos una especialidad"),
})

export default function PerfilAbogado() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [form, setForm] = useState({
    rut: "",
    numero_colegio: "",
    bio: "",
    tarifa_hora: "",
    years_experiencia: "",
    especialidades: [] as string[],
  })

  useEffect(() => {
    async function cargarPerfil() {
      setCargando(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      setUserId(user.id)

      const { data } = await supabase
        .from("lawyer_profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (data) {
        setForm({
          rut: data.rut ?? "",
          numero_colegio: data.numero_colegio ?? "",
          bio: data.bio ?? "",
          tarifa_hora: data.tarifa_hora?.toString() ?? "",
          years_experiencia: data.years_experiencia?.toString() ?? "",
          especialidades: data.especialidades ?? [],
        })
      }
      setCargando(false)
    }
    cargarPerfil()
  }, [router])

  function toggleEspecialidad(especialidad: string) {
    setForm((prev) => ({
      ...prev,
      especialidades: prev.especialidades.includes(especialidad)
        ? prev.especialidades.filter((e) => e !== especialidad)
        : [...prev.especialidades, especialidad],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setExito(false)

    const resultado = esquema.safeParse(form)
    if (!resultado.success) {
      setError(resultado.error.issues[0].message)
      return
    }

    if (!userId) return router.push("/login")

    setGuardando(true)
    const supabase = createClient()

    try {
      const { error: errorSupabase } = await supabase
        .from("lawyer_profiles")
        .upsert({
          id: userId,
          rut: resultado.data.rut,
          numero_colegio: resultado.data.numero_colegio,
          bio: resultado.data.bio,
          tarifa_hora: resultado.data.tarifa_hora,
          years_experiencia: resultado.data.years_experiencia,
          especialidades: resultado.data.especialidades,
        })

      if (errorSupabase) {
        setError("No se pudo guardar el perfil. Inténtalo nuevamente.")
        return
      }

      setExito(true)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Mi perfil profesional</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Esta información será visible para los clientes en el marketplace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Datos profesionales
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                placeholder="12.345.678-9"
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_colegio">N° Colegio de Abogados</Label>
              <Input
                id="numero_colegio"
                placeholder="12345"
                value={form.numero_colegio}
                onChange={(e) => setForm({ ...form, numero_colegio: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tarifa_hora">Tarifa por hora (CLP)</Label>
              <Input
                id="tarifa_hora"
                type="number"
                placeholder="50000"
                value={form.tarifa_hora}
                onChange={(e) => setForm({ ...form, tarifa_hora: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years_experiencia">Años de experiencia</Label>
              <Input
                id="years_experiencia"
                type="number"
                placeholder="3"
                value={form.years_experiencia}
                onChange={(e) => setForm({ ...form, years_experiencia: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Especialidades
          </h2>
          <div className="flex flex-wrap gap-2">
            {ESPECIALIDADES.map((esp) => {
              const activa = form.especialidades.includes(esp)
              return (
                <button
                  key={esp}
                  type="button"
                  onClick={() => toggleEspecialidad(esp)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    activa
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary"
                  }`}
                >
                  {esp}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biografía profesional</Label>
          <textarea
            id="bio"
            rows={4}
            placeholder="Describe tu experiencia, logros y enfoque profesional..."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {form.bio.length} caracteres
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {exito && (
          <p className="text-sm text-green-600">
            Perfil guardado correctamente.
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar perfil"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/abogado")}
          >
            Volver al dashboard
          </Button>
        </div>
      </form>
    </div>
  )
}