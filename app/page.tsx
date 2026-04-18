export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-xl text-blue-700">LegalMarket</span>
        <div className="flex gap-4">
          <a href="/login" className="text-sm text-gray-600 hover:text-gray-900">Iniciar sesión</a>
          <a href="/registro" className="text-sm bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800">Registrarse</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Asesoría legal accesible para todos
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Publica tu caso, recibe postulaciones de abogados verificados y elige al mejor para ti. Simple, transparente y sin sorpresas.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/registro" className="bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-800">
            Publicar mi caso
          </a>
          <a href="/registro?rol=abogado" className="border border-blue-700 text-blue-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-50">
            Soy abogado
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-4">⚖️</div>
            <h3 className="font-semibold text-lg mb-2">Abogados verificados</h3>
            <p className="text-gray-500 text-sm">Todos los profesionales pasan por un proceso de verificación de credenciales.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-4">💬</div>
            <h3 className="font-semibold text-lg mb-2">Comunicación directa</h3>
            <p className="text-gray-500 text-sm">Chatea directamente con tu abogado, comparte documentos y haz seguimiento de tu caso.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-4">📄</div>
            <h3 className="font-semibold text-lg mb-2">Servicios automatizados</h3>
            <p className="text-gray-500 text-sm">Genera documentos legales básicos en minutos con nuestros formularios guiados.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-gray-400">
        © 2025 LegalMarket · Santiago, Chile
      </footer>
    </main>
  )
}