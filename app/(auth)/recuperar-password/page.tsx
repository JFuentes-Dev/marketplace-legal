"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const esquema = z.object({
  email: z.string().email("Ingresa un email válido"),
})

export default function RecuperarPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const resultado = esquema.safeParse({ email })
    if (!resultado.success) {
      setError(resultado.error.errors[0].message)
      return
    }

    setCargando(true)
    const supabase = createClient()

    const { error: errorSupabase } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/actualizar-password`,
      }
    )

    setCargando(false)

    if (errorSupabase) {
      setError("Ocurrió un error. Inténtalo nuevamente.")
      return
    }

    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="text-4xl">✉️</div>
          <h1 className="text-2xl font-semibold">Revisa tu correo</h1>
          <p className="text-muted-foreground">
            Si <strong>{email}</strong> está registrado, recibirás un enlace
            para restablecer tu contraseña en los próximos minutos.
          </p>
          <p className="text-sm text-muted-foreground">
            ¿No llegó? Revisa la carpeta de spam.
          </p>
          <Link href="/login">
            <Button variant="outline" className="mt-4">
              Volver al inicio de sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu email y te enviaremos un enlace para restablecer tu
            contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? "Enviando..." : "Enviar enlace"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Recordaste tu contraseña?{" "}
          <Link href="/login" className="underline hover:text-foreground">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}