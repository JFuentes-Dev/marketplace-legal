import { randomBytes } from "crypto";

export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function tienePasswordMinima(password: string): boolean {
  return password.length >= 8;
}

export function passwordsCoinciden(
  password: string,
  confirmPassword: string
): boolean {
  return password === confirmPassword;
}

export function obtenerEstadoLabel(estado: string): string {
  const estados: Record<string, string> = {
    pendiente: "Pendiente",
    asignado: "Asignado",
    en_curso: "En curso",
    cerrado: "Cerrado",
  };

  return estados[estado] ?? "Desconocido";
}

export function generarCodigoSeguimiento(): string {
  return `ML-${randomBytes(3).toString("hex").toUpperCase()}`;
}