// lib/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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
  return resend.emails.send({
    from: FROM,
    to: emailAbogado,
    subject: `Nuevo caso asignado: ${tituloCaso}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e40af">Marketplace Legal</h2>
        <p>Hola <strong>${nombreAbogado}</strong>,</p>
        <p>Se te ha asignado un nuevo caso:</p>
        <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0">
          <strong>${tituloCaso}</strong>
        </div>
        <a href="${APP_URL}/dashboard/abogado/casos/${casoId}"
           style="background:#1e40af;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
          Ver caso
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:32px">
          Marketplace Legal — Proyecto Duoc UC
        </p>
      </div>
    `,
  })
}

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
  return resend.emails.send({
    from: FROM,
    to: emailDestinatario,
    subject: `Nuevo mensaje en: ${tituloCaso}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e40af">Marketplace Legal</h2>
        <p>Hola <strong>${nombreDestinatario}</strong>,</p>
        <p><strong>${nombreRemitente}</strong> te ha enviado un mensaje en el caso:</p>
        <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0">
          <strong>${tituloCaso}</strong>
        </div>
        <a href="${APP_URL}/dashboard/${rol}/casos/${casoId}"
           style="background:#1e40af;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
          Ver mensaje
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:32px">
          Marketplace Legal — Proyecto Duoc UC
        </p>
      </div>
    `,
  })
}