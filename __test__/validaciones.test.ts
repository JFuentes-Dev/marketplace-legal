import { describe, expect, it } from "vitest";
import {
  esEmailValido,
  tienePasswordMinima,
  passwordsCoinciden,
  obtenerEstadoLabel,
  generarCodigoSeguimiento,
} from "../lib/validaciones";

describe("Email", () => {
  it("acepta email válido", () => {
    expect(esEmailValido("test@test.com")).toBe(true);
  });

  it("rechaza email inválido", () => {
    expect(esEmailValido("test.com")).toBe(false);
  });
});

describe("Password", () => {
  it("acepta contraseña >= 8 caracteres", () => {
    expect(tienePasswordMinima("12345678")).toBe(true);
  });

  it("rechaza contraseña corta", () => {
    expect(tienePasswordMinima("123")).toBe(false);
  });
});

describe("Confirmación password", () => {
  it("coinciden", () => {
    expect(passwordsCoinciden("abc12345", "abc12345")).toBe(true);
  });

  it("no coinciden", () => {
    expect(passwordsCoinciden("abc12345", "abc99999")).toBe(false);
  });
});

describe("Estados", () => {
  it("pendiente", () => {
    expect(obtenerEstadoLabel("pendiente")).toBe("Pendiente");
  });

  it("desconocido", () => {
    expect(obtenerEstadoLabel("algo")).toBe("Desconocido");
  });
});

describe("Código seguimiento", () => {
  it("comienza con ML-", () => {
    expect(generarCodigoSeguimiento()).toMatch(/^ML-/);
  });

  it("genera códigos distintos", () => {
    const a = generarCodigoSeguimiento();
    const b = generarCodigoSeguimiento();

    expect(a).not.toBe(b);
  });
});