import { describe, expect, it, vi, beforeEach } from "vitest"

const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()
const mockUpdate = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

import { POST } from "../app/api/admin/verify-lawyer/route"

describe("POST /api/admin/verify-lawyer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna 401 si no hay usuario autenticado", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain("No autorizado")
  })

  it("retorna 500 si falla obtener perfil", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
        },
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })

    mockSingle.mockResolvedValue({
      data: null,
      error: {
        message: "error",
      },
    })

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    })

    const response = await POST(req)

    expect(response.status).toBe(500)
  })

  it("retorna 403 si el usuario no es admin", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
        },
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })

    mockSingle.mockResolvedValue({
      data: {
        role: "lawyer",
      },
      error: null,
    })

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    })

    const response = await POST(req)

    expect(response.status).toBe(403)
  })

  it("retorna 400 si lawyerId no es UUID válido", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
        },
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })

    mockSingle.mockResolvedValue({
      data: {
        role: "admin",
      },
      error: null,
    })

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        lawyerId: "123",
        verified: true,
      }),
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
  })

  it("retorna 400 si falta verified", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
        },
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })

    mockSingle.mockResolvedValue({
      data: {
        role: "admin",
      },
      error: null,
    })

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        lawyerId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
  })

  it("retorna 500 si falla actualización", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
        },
      },
      error: null,
    })

    mockFrom.mockImplementation((table) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    role: "admin",
                  },
                  error: null,
                }),
            }),
          }),
        }
      }

      if (table === "lawyer_profiles") {
        return {
          update: () => ({
            eq: () =>
              Promise.resolve({
                error: {
                  message: "db error",
                },
              }),
          }),
        }
      }
    })

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        lawyerId: "550e8400-e29b-41d4-a716-446655440000",
        verified: true,
      }),
    })

    const response = await POST(req)

    expect(response.status).toBe(500)
  })

  it("verifica abogado correctamente", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
        },
      },
      error: null,
    })

    mockFrom.mockImplementation((table) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    role: "admin",
                  },
                  error: null,
                }),
            }),
          }),
        }
      }

      if (table === "lawyer_profiles") {
        return {
          update: () => ({
            eq: () =>
              Promise.resolve({
                error: null,
              }),
          }),
        }
      }
    })

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        lawyerId: "550e8400-e29b-41d4-a716-446655440000",
        verified: true,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.mensaje).toContain("verificado")
  })

  it("desverifica abogado correctamente", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
        },
      },
      error: null,
    })

    mockFrom.mockImplementation((table) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    role: "admin",
                  },
                  error: null,
                }),
            }),
          }),
        }
      }

      if (table === "lawyer_profiles") {
        return {
          update: () => ({
            eq: () =>
              Promise.resolve({
                error: null,
              }),
          }),
        }
      }
    })

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        lawyerId: "550e8400-e29b-41d4-a716-446655440000",
        verified: false,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.mensaje).toContain("desverificado")
  })
})