import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useArchiveRole() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRole() {
      const { data, error } = await supabase.rpc('current_archive_role')

      if (error) {
        console.error('Failed to load archive role:', error)
        setRole(null)
      } else {
        setRole(data)
      }

      setLoading(false)
    }

    loadRole()
  }, [])

  return {
    role,
    loading,
    isAdmin: role === 'ADMIN',
  }
}