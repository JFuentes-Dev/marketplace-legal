import Link from "next/link";
import { NavLogo } from "@/components/shared/NavLogo";

/* ── Iconos inline SVG (sin dependencias extra) ─────────────────── */
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,7 5.5,10.5 12,3.5" />
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" />
    <polyline points="8,3 12,7 8,11" />
  </svg>
);

export default function LandingPage() {
  return (
    <div style={{ background: "var(--dls-cream)" }}>

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav
        style={{
          background: "var(--dls-navy)",
          borderBottom: "1px solid rgba(201,163,90,0.2)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <NavLogo />

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <Link href="/abogados" className="nav-link">Ver abogados</Link>
            <Link href="/login" className="nav-link">Iniciar sesión</Link>
            <Link href="/registro" className="btn-primary" style={{ padding: "10px 20px", fontSize: 10 }}>
              <span>Registrarse</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "120px 24px 100px",
          background: "var(--dls-cream)",
        }}
      >
        {/* Fondo decorativo */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -80, right: -120,
            width: 600, height: 600,
            background: "radial-gradient(circle, rgba(201,163,90,0.08) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0, left: "5%",
            width: 1, height: "60%",
            background: "linear-gradient(to bottom, transparent, var(--dls-champagne), transparent)",
            opacity: 0.25,
          }}
        />

        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 80,
              alignItems: "center",
            }}
          >
            {/* Copy */}
            <div>
              <div className="eyebrow animate-fade-up" style={{ marginBottom: 24 }}>
                Plataforma Legal · Chile
              </div>

              <h1
                className="animate-fade-up delay-100"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "clamp(48px, 6vw, 72px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.012em",
                  color: "var(--dls-navy)",
                  marginBottom: 28,
                }}
              >
                Cerrar una etapa,{" "}
                <em
                  style={{
                    fontStyle: "italic",
                    color: "var(--dls-champagne)",
                    display: "block",
                  }}
                >
                  con serenidad.
                </em>
              </h1>

              <p
                className="animate-fade-up delay-200"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "var(--dls-navy-mid)",
                  marginBottom: 40,
                  maxWidth: 440,
                }}
              >
                Conectamos personas con abogados verificados. Acompañamos cada proceso legal con claridad, transparencia y compromiso profesional.
              </p>

              <div
                className="animate-fade-up delay-300"
                style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}
              >
                <Link href="/registro?role=cliente" className="btn-primary">
                  <span>Necesito un abogado</span>
                  <IconArrow />
                </Link>
                <Link href="/registro?role=abogado" className="btn-secondary">
                  <span>Soy abogado</span>
                  <IconArrow />
                </Link>
              </div>

              {/* Stats */}
              <div
                className="animate-fade-up delay-400"
                style={{
                  display: "flex",
                  gap: 40,
                  marginTop: 56,
                  paddingTop: 32,
                  borderTop: "1px solid var(--dls-hairline)",
                }}
              >
                {[
                  { n: "100%", label: "Abogados verificados" },
                  { n: "3", label: "Áreas especializadas" },
                  { n: "24h", label: "Respuesta garantizada" },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 500,
                        fontSize: 32,
                        color: "var(--dls-navy)",
                        lineHeight: 1,
                      }}
                    >
                      {s.n}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        color: "var(--dls-taupe)",
                        marginTop: 4,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta editorial */}
            <div
              className="animate-fade-up delay-200"
              style={{ position: "relative" }}
            >
              {/* Card principal */}
              <div
                className="card-dls accent"
                style={{
                  padding: 40,
                  background: "var(--dls-white)",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 20 }}>
                  Proceso
                </div>
                <blockquote
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 26,
                    lineHeight: 1.45,
                    color: "var(--dls-navy)",
                    marginBottom: 24,
                    borderLeft: "none",
                    padding: 0,
                  }}
                >
                  "Entender tus opciones es el primer paso. Estamos aquí para acompañarte."
                </blockquote>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: "var(--dls-navy)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 14,
                        color: "var(--dls-champagne)",
                        fontWeight: 600,
                      }}
                    >
                      ML
                    </span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--dls-navy)",
                      }}
                    >
                      Equipo Marketplace Legal
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "var(--dls-taupe)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Abogados verificados · Chile
                    </div>
                  </div>
                </div>
              </div>

              {/* Card flotante */}
              <div
                style={{
                  position: "absolute",
                  bottom: -24,
                  right: -24,
                  background: "var(--dls-navy)",
                  padding: "20px 24px",
                  minWidth: 200,
                  zIndex: 1,
                  border: "1px solid rgba(201,163,90,0.3)",
                }}
              >
                <div className="eyebrow" style={{ color: "var(--dls-champagne)", marginBottom: 8 }}>
                  Estado de caso
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "var(--dls-cream)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      background: "#4ade80",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "champagnePulse 2s ease-in-out infinite",
                    }}
                  />
                  En progreso — Derecho de familia
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────── */}
      <section style={{ background: "var(--dls-white)", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              En 3 pasos
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(32px, 4vw, 48px)",
                color: "var(--dls-navy)",
              }}
            >
              ¿Cómo{" "}
              <em style={{ color: "var(--dls-champagne)", fontStyle: "italic" }}>
                funciona?
              </em>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 2,
            }}
          >
            {[
              {
                roman: "I",
                title: "Publica tu caso",
                desc: "Describe tu situación y el área en la que necesitas ayuda. Sin compromiso, sin costo inicial.",
              },
              {
                roman: "II",
                title: "Te asignamos un abogado",
                desc: "Un profesional verificado y especialista en tu área evalúa tu caso y te contacta.",
              },
              {
                roman: "III",
                title: "Resuelve con claridad",
                desc: "Comunícate directamente desde la plataforma y sigue el progreso de tu proceso legal.",
              },
            ].map((step, i) => (
              <div
                key={step.roman}
                className="card-dls"
                style={{
                  background: i === 1 ? "var(--dls-navy)" : "var(--dls-white)",
                  borderColor: i === 1 ? "var(--dls-navy)" : "var(--dls-hairline)",
                  padding: "48px 40px",
                  animationDelay: `${i * 150}ms`,
                }}
              >
                <div
                  className="roman-number"
                  style={{
                    fontSize: 11,
                    color: "var(--dls-champagne)",
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 1,
                      height: 24,
                      background: "var(--dls-champagne)",
                      opacity: 0.4,
                    }}
                  />
                  {step.roman}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 26,
                    color: i === 1 ? "var(--dls-cream)" : "var(--dls-navy)",
                    marginBottom: 16,
                    lineHeight: 1.2,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: i === 1 ? "rgba(250,244,237,0.7)" : "var(--dls-taupe)",
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ───────────────────────────────────────────── */}
      <section style={{ background: "var(--dls-cream)", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 80,
              alignItems: "start",
            }}
          >
            {/* Título */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 20 }}>
                Por qué elegirnos
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "clamp(36px, 4vw, 52px)",
                  color: "var(--dls-navy)",
                  lineHeight: 1.1,
                  marginBottom: 28,
                }}
              >
                Profesionalismo{" "}
                <em style={{ color: "var(--dls-champagne)", fontStyle: "italic", display: "block" }}>
                  en cada etapa
                </em>
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: "var(--dls-navy-mid)",
                  marginBottom: 40,
                }}
              >
                Cada abogado en nuestra plataforma pasa por un proceso de verificación riguroso. No solo validamos credenciales — evaluamos trayectoria y compromiso con el cliente.
              </p>
              <Link href="/abogados" className="btn-primary">
                <span>Explorar abogados</span>
                <IconArrow />
              </Link>
            </div>

            {/* Lista */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  title: "Abogados verificados",
                  desc: "Validamos RUT, número de colegio y experiencia antes de publicar cualquier perfil.",
                },
                {
                  title: "Especialidades claras",
                  desc: "Filtra por área legal: familia, laboral, civil, penal, inmigración y más.",
                },
                {
                  title: "Comunicación directa",
                  desc: "Mensajería integrada con tiempo real para coordinar sin salir de la plataforma.",
                },
                {
                  title: "Seguimiento del caso",
                  desc: "Conoce el estado en todo momento: pendiente, asignado, en progreso o cerrado.",
                },
              ].map((b, i) => (
                <div
                  key={b.title}
                  className="beneficio-item"
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      background: "var(--dls-champagne)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                      color: "var(--dls-navy)",
                    }}
                  >
                    <IconCheck />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: 15,
                        color: "var(--dls-navy)",
                        marginBottom: 4,
                      }}
                    >
                      {b.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: "var(--dls-taupe)",
                      }}
                    >
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIO ───────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--dls-blush)",
          padding: "80px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(120px, 20vw, 240px)",
            fontWeight: 500,
            color: "rgba(15,30,58,0.04)",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          &ldquo;
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 80,
              color: "var(--dls-champagne)",
              lineHeight: 0.6,
              marginBottom: 24,
            }}
          >
            &ldquo;
          </div>
          <blockquote
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(24px, 3vw, 36px)",
              lineHeight: 1.45,
              color: "var(--dls-navy)",
              fontWeight: 400,
              marginBottom: 32,
            }}
          >
            La plataforma me permitió entender mis opciones con claridad. El proceso fue transparente y el abogado asignado respondió todas mis dudas con paciencia.
          </blockquote>
          <div className="eyebrow" style={{ color: "var(--dls-navy-mid)" }}>
            — Cliente · Derecho de familia
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--dls-navy)",
          padding: "96px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decoración */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(201,163,90,0.04) 0px, rgba(201,163,90,0.04) 1px, transparent 1px, transparent 80px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 24 }}>
            Empieza hoy
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(36px, 5vw, 60px)",
              color: "var(--dls-cream)",
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            ¿Listo para resolver{" "}
            <em style={{ color: "var(--dls-champagne)", fontStyle: "italic" }}>
              tu situación?
            </em>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              color: "rgba(250,244,237,0.65)",
              marginBottom: 48,
              lineHeight: 1.7,
            }}
          >
            Regístrate en minutos y publica tu primer caso. Sin costos ocultos, sin compromisos.
          </p>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registro" className="btn-cta-champagne">
              <span>Crear cuenta gratis</span>
              <IconArrow />
            </Link>
            <Link href="/abogados" className="btn-secondary" style={{ color: "var(--dls-cream)", borderBottomColor: "rgba(201,163,90,0.5)" }}>
              <span>Ver abogados</span>
              <IconArrow />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer
        style={{
          background: "var(--dls-navy)",
          borderTop: "1px solid rgba(201,163,90,0.2)",
          padding: "48px 24px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 20,
                color: "var(--dls-cream)",
                marginBottom: 4,
              }}
            >
              Marketplace{" "}
              <em style={{ color: "var(--dls-champagne)", fontStyle: "italic" }}>
                &
              </em>{" "}
              Legal
            </div>
            <div className="eyebrow" style={{ color: "var(--dls-taupe)", fontSize: 9 }}>
              Proyecto de título · Duoc UC · Ingeniería en Informática
            </div>
          </div>

          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <Link href="/abogados" className="nav-link" style={{ fontSize: 10 }}>Abogados</Link>
            <Link href="/login"    className="nav-link" style={{ fontSize: 10 }}>Ingresar</Link>
            <Link href="/registro" className="nav-link" style={{ fontSize: 10 }}>Registrarse</Link>
          </div>
        </div>

        <div
          style={{
            maxWidth: 1200,
            margin: "32px auto 0",
            paddingTop: 24,
            borderTop: "1px solid rgba(201,163,90,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--dls-taupe)",
            }}
          >
            © {new Date().getFullYear()} Marketplace Legal. Todos los derechos reservados.
          </p>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "rgba(166,143,133,0.5)",
              letterSpacing: "0.08em",
            }}
          >
            CHILE · LEGAL · VERIFIED
          </div>
        </div>
      </footer>
    </div>
  );
}