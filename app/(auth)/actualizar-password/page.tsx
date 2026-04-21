"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const esquema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmacion: z.string(),
  })
  .refine((d) => d.password === d.confirmacion, {
    message: "Las contraseñas no coinciden",
    path: ["confirmacion"],
  })

export default function ActualizarPassword() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmacion, setConfirmacion] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const resultado = esquema.safeParse({ password, confirmacion })
    if (!resultado.success) {
      setError(resultado.error.issues[0].message)
      return
    }

    setCargando(true)
    const supabase = createClient()

    const { error: errorSupabase } = await supabase.auth.updateUser({
      password,
    })

    setCargando(false)

    if (errorSupabase) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.")
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Elige una contraseña segura de al menos 8 caracteres.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmacion">Confirmar contraseña</Label>
            <Input
              id="confirmacion"
              type="password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? "Guardando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  )
}