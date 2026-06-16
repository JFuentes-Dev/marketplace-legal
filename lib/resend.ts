// lib/resend.ts

import { Resend } from 'resend'

const FROM =
  process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function getResend() {
  const key = process.env.RESEND_API_KEY

  if (!key) {
    throw new Error('RESEND_API_KEY no configurada')
  }

  return new Resend(key)
}

// ─── Email de asignación al abogado ─────────────────────────────────────────
export async function enviarEmailAsignacion({
  emailAbogado,
  nombreAbogado,
  tituloCaso,
  casoId,
}: {
  emailAbogado: string
  nombreAbogado: string
  tituloCaso: string
  casoId: string
}) {
  const resend = getResend()

  return resend.emails.send({
    from: FROM,
    to: emailAbogado,
    subject: `Nuevo caso asignado: ${tituloCaso}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#faf4ed;padding:0">
        <div style="background:#0f1e3a;padding:32px 40px">
          <div style="font-family:Georgia,serif;font-size:20px;color:#faf4ed;font-weight:500">
            Marketplace <em style="color:#c9a35a">&</em> Legal
          </div>
          <div style="font-size:10px;color:rgba(201,163,90,0.6);letter-spacing:0.1em;margin-top:4px;text-transform:uppercase">Chile · Verified</div>
        </div>

        <div style="padding:40px">
          <p style="font-size:14px;color:#2a3a5c;margin-bottom:8px">Hola, <strong>${nombreAbogado}</strong></p>
          <p style="font-size:14px;color:#a68f85;margin-bottom:28px">Se te ha asignado un nuevo caso en la plataforma.</p>

          <div style="background:#0f1e3a;padding:24px 28px;margin-bottom:28px">
            <div style="font-size:10px;color:rgba(201,163,90,0.7);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Caso asignado</div>
            <div style="font-family:Georgia,serif;font-size:20px;color:#faf4ed;font-weight:500">${tituloCaso}</div>
          </div>

          <a href="${APP_URL}/dashboard/abogado/casos/${casoId}"
            style="display:inline-block;background:#c9a35a;color:#0f1e3a;padding:13px 28px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">
            Ver caso →
          </a>
        </div>

        <div style="padding:20px 40px;border-top:1px solid rgba(15,30,58,0.1)">
          <p style="font-size:11px;color:#a68f85;letter-spacing:0.06em;text-transform:uppercase;margin:0">
            Marketplace Legal — Proyecto Duoc UC
          </p>
        </div>
      </div>
    `,
  })
}

// ─── Email de nuevo mensaje ──────────────────────────────────────────────────
export async function enviarEmailMensajeNuevo({
  emailDestinatario,
  nombreDestinatario,
  nombreRemitente,
  tituloCaso,
  casoId,
  rol,
}: {
  emailDestinatario: string
  nombreDestinatario: string
  nombreRemitente: string
  tituloCaso: string
  casoId: string
  rol: 'cliente' | 'abogado'
}) {
  const resend = getResend()

  return resend.emails.send({
    from: FROM,
    to: emailDestinatario,
    subject: `Nuevo mensaje en: ${tituloCaso}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#faf4ed;padding:0">
        <div style="background:#0f1e3a;padding:32px 40px">
          <div style="font-family:Georgia,serif;font-size:20px;color:#faf4ed;font-weight:500">
            Marketplace <em style="color:#c9a35a">&</em> Legal
          </div>
        </div>
        <div style="padding:40px">
          <p style="font-size:14px;color:#2a3a5c;margin-bottom:8px">Hola, <strong>${nombreDestinatario}</strong></p>
          <p style="font-size:14px;color:#a68f85;margin-bottom:28px">
            <strong>${nombreRemitente}</strong> te ha enviado un mensaje en el caso <strong>${tituloCaso}</strong>.
          </p>
          <a href="${APP_URL}/dashboard/${rol}/casos/${casoId}"
            style="display:inline-block;background:#c9a35a;color:#0f1e3a;padding:13px 28px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">
            Ver mensaje →
          </a>
        </div>
        <div style="padding:20px 40px;border-top:1px solid rgba(15,30,58,0.1)">
          <p style="font-size:11px;color:#a68f85;letter-spacing:0.06em;text-transform:uppercase;margin:0">
            Marketplace Legal — Proyecto Duoc UC
          </p>
        </div>
      </div>
    `,
  })
}

// ─── Email con código de seguimiento (caso anónimo) ─────────────────────────
export async function enviarCodigoSeguimiento({
  email,
  nombre,
  tituloCaso,
  areaCaso,
  codigo,
  docsCount,
}: {
  email: string
  nombre: string
  tituloCaso: string
  areaCaso: string
  codigo: string
  docsCount: number
}) {
  const resend = getResend()

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Tu código de seguimiento: ${codigo} — Marketplace Legal`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#faf4ed;padding:0">

        <!-- Header -->
        <div style="background:#0f1e3a;padding:32px 40px">
          <div style="font-family:Georgia,serif;font-size:20px;color:#faf4ed;font-weight:500">
            Marketplace <em style="color:#c9a35a">&</em> Legal
          </div>
          <div style="font-size:10px;color:rgba(201,163,90,0.6);letter-spacing:0.1em;margin-top:4px;text-transform:uppercase">Chile · Verified</div>
        </div>

        <!-- Body -->
        <div style="padding:40px">
          <p style="font-size:14px;color:#2a3a5c;margin-bottom:6px">Hola, <strong>${nombre}</strong></p>
          <p style="font-size:14px;color:#a68f85;margin-bottom:32px;line-height:1.7">
            Tu caso ha sido recibido con éxito. A continuación encontrarás tu código de seguimiento — guárdalo en un lugar seguro.
          </p>

          <!-- Caso info -->
          <div style="background:white;border:1px solid rgba(15,30,58,0.1);padding:20px 24px;margin-bottom:28px">
            <div style="font-size:10px;color:#a68f85;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Caso registrado</div>
            <div style="font-family:Georgia,serif;font-size:18px;color:#0f1e3a;font-weight:500;margin-bottom:4px">${tituloCaso}</div>
            <div style="font-size:12px;color:#c9a35a;letter-spacing:0.06em;text-transform:uppercase">${areaCaso}</div>
            ${docsCount > 0 ? `<div style="font-size:12px;color:#a68f85;margin-top:8px">${docsCount} documento${docsCount !== 1 ? 's' : ''} adjunto${docsCount !== 1 ? 's' : ''}</div>` : ''}
          </div>

          <!-- Código -->
          <div style="background:#0f1e3a;padding:28px 32px;margin-bottom:32px;text-align:center">
            <div style="font-size:10px;color:rgba(201,163,90,0.7);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px">
              Código de seguimiento
            </div>
            <div style="font-family:Courier New,monospace;font-size:36px;font-weight:700;color:#c9a35a;letter-spacing:0.15em">
              ${codigo}
            </div>
          </div>

          <!-- Instrucciones -->
          <div style="margin-bottom:32px">
            <p style="font-size:13px;font-weight:700;color:#0f1e3a;margin-bottom:12px">¿Qué sigue?</p>
            <div style="display:flex;gap:12px;margin-bottom:10px">
              <span style="font-family:Georgia,serif;color:#c9a35a;font-size:16px;font-weight:500;flex-shrink:0">1.</span>
              <p style="font-size:13px;color:#a68f85;line-height:1.6;margin:0">
                <strong style="color:#0f1e3a">Vinculación automática:</strong> Si creas una cuenta con este email (<em>${email}</em>), tu caso se vinculará automáticamente a tu perfil.
              </p>
            </div>
            <div style="display:flex;gap:12px;margin-bottom:10px">
              <span style="font-family:Georgia,serif;color:#c9a35a;font-size:16px;font-weight:500;flex-shrink:0">2.</span>
              <p style="font-size:13px;color:#a68f85;line-height:1.6;margin:0">
                <strong style="color:#0f1e3a">Vinculación manual:</strong> Si ya tienes cuenta o usas otro email, ingresa el código desde tu panel de cliente.
              </p>
            </div>
            <div style="display:flex;gap:12px">
              <span style="font-family:Georgia,serif;color:#c9a35a;font-size:16px;font-weight:500;flex-shrink:0">3.</span>
              <p style="font-size:13px;color:#a68f85;line-height:1.6;margin:0">
                Un abogado revisará tu caso y se pondrá en contacto contigo a la brevedad.
              </p>
            </div>
          </div>

          <!-- CTA -->
          <a href="${APP_URL}/registro?email=${encodeURIComponent(email)}"
            style="display:inline-block;background:#c9a35a;color:#0f1e3a;padding:13px 28px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">
            Crear cuenta y ver mi caso →
          </a>
        </div>

        <!-- Footer -->
        <div style="padding:20px 40px;border-top:1px solid rgba(15,30,58,0.1)">
          <p style="font-size:11px;color:#a68f85;letter-spacing:0.06em;text-transform:uppercase;margin:0">
            Marketplace Legal · Proyecto Duoc UC · Chile
          </p>
          <p style="font-size:11px;color:rgba(166,143,133,0.6);margin-top:4px">
            Si no enviaste este caso, puedes ignorar este email.
          </p>
        </div>
      </div>
    `,
  })
}