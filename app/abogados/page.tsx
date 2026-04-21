import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function ListadoAbogados() {
  const supabase = await createClient()

  const { data: abogados } = await supabase
    .from("lawyer_profiles")
    .select(`
      id,
      especialidades,
      years_experiencia,
      profiles (
        nombre,
        apellido,
        avatar_url
      )
    `)
    .eq("verified", true)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Abogados disponibles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Profesionales verificados listos para ayudarte.
        </p>
      </div>

      {!abogados || abogados.length === 0 ? (
        <p className="text-muted-foreground">No hay abogados verificados por el momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {abogados.map((abogado) => {
            const perfil = abogado.profiles as {
              nombre: string
              apellido: string
              avatar_url: string | null
            } | null

            return (
              <Link
                key={abogado.id}
                href={`/abogados/${abogado.id}`}
                className="border rounded-lg p-4 hover:border-primary transition-colors space-y-3"
              >
                <div className="flex items-center gap-3">
                  {perfil?.avatar_url ? (
                    <img
                      src={perfil.avatar_url}
                      alt={`${perfil.nombre} ${perfil.apellido}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium text-muted-foreground">
                      {perfil?.nombre?.[0]}{perfil?.apellido?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {perfil?.nombre} {perfil?.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {abogado.years_experiencia} año{abogado.years_experiencia !== 1 ? "s" : ""} de experiencia
                    </p>
                  </div>
                </div>

                {abogado.especialidades?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(abogado.especialidades as string[]).slice(0, 3).map((esp) => (
                      <span
                        key={esp}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {esp}
                      </span>
                    ))}
                    {abogado.especialidades.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        +{abogado.especialidades.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}