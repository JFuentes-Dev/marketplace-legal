import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PerfilAbogado({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from("lawyer_profiles")
    .select(`
      id,
      especialidades,
      years_experiencia,
      bio,
      tarifa_hora,
      profiles (
        nombre,
        apellido,
        avatar_url
      )
    `)
    .eq("id", id)
    .eq("verified", true)
    .single()

  if (!data) notFound()

  const perfil = data.profiles as {
    nombre: string
    apellido: string
    avatar_url: string | null
  } | null

  const nombre = `${perfil?.nombre ?? ""} ${perfil?.apellido ?? ""}`.trim()
  const iniciales = `${perfil?.nombre?.[0] ?? ""}${perfil?.apellido?.[0] ?? ""}`

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link
        href="/abogados"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Volver al listado
      </Link>

      {/* Cabecera */}
      <div className="flex items-center gap-4">
        {perfil?.avatar_url ? (
          <img
            src={perfil.avatar_url}
            alt={nombre}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-medium text-muted-foreground">
            {iniciales}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {data.years_experiencia} año{data.years_experiencia !== 1 ? "s" : ""} de experiencia
          </p>
          {data.tarifa_hora && (
            <p className="text-sm font-medium mt-1">
              ${data.tarifa_hora.toLocaleString("es-CL")} / hora
            </p>
          )}
        </div>
      </div>

      {/* Especialidades */}
      {data.especialidades?.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Especialidades
          </h2>
          <div className="flex flex-wrap gap-2">
            {(data.especialidades as string[]).map((esp) => (
              <span
                key={esp}
                className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground"
              >
                {esp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Biografía */}
      {data.bio && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sobre mí
          </h2>
          <p className="text-sm leading-relaxed">{data.bio}</p>
        </div>
      )}

      {/* CTA */}
      <div className="border rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium">¿Necesitas asesoría?</p>
        <p className="text-xs text-muted-foreground">
          Crea una cuenta o inicia sesión para contactar a este abogado.
        </p>
        <div className="flex gap-2 pt-1">
          <Link
            href="/registro"
            className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Registrarse
          </Link>
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-md border hover:bg-muted transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}