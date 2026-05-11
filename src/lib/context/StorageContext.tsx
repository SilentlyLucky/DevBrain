'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StorageContextValue {
  storageUsedBytes: number | null
  refreshStorage: () => void
}

const StorageContext = createContext<StorageContextValue>({ storageUsedBytes: null, refreshStorage: () => {} })

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [storageUsedBytes, setStorageUsedBytes] = useState<number | null>(null)

  const refreshStorage = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: files } = await supabase.storage
      .from('documents')
      .list(user.id, { limit: 1000 })
    const bytes = files?.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0) ?? 0
    setStorageUsedBytes(bytes)
  }, [])

  useEffect(() => {
    const loadStorage = async () => {
      await refreshStorage()
    }
    loadStorage()
  }, [refreshStorage])

  return (
    <StorageContext.Provider value={{ storageUsedBytes, refreshStorage }}>
      {children}
    </StorageContext.Provider>
  )
}

export function useStorage() {
  return useContext(StorageContext)
}
