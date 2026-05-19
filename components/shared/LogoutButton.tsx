'use client'
// components/shared/LogoutButton.tsx
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="btn-secondary"
      style={{ fontSize: 10 }}
    >
      Cerrar sesión
    </button>
  )
}