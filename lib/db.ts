"use client"

import { useEffect, useMemo, useState } from "react"
import { SupabaseStorage, type StoredFile } from "./storage"
import { useAuth } from "../components/auth"

export { type StoredFile } from "./storage"

export function useLiveFiles() {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [isLoading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setFiles([])
      setLoading(false)
      return
    }

    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const userFiles = await SupabaseStorage.getFiles(user.id)
        if (!cancelled) setFiles(userFiles)
      } catch (error) {
        console.error('Error fetching files:', error)
        console.error('Error message:', error?.message)
        console.error('Error code:', error?.code)
        console.error('Full error details:', JSON.stringify(error, null, 2))
        if (!cancelled) setFiles([])
      }
      setLoading(false)
    }
    run()

    const t = setInterval(run, 2000) // More frequent updates
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [user])

  const totalStorage = useMemo(() => {
    return files.reduce((total, file) => total + (file.size || 0), 0)
  }, [files])

  return useMemo(() => ({ files, isLoading, totalStorage }), [files, isLoading, totalStorage])
}

export const db = {
  files: {
    add: async (file: File, userId: string, tags: string[] = []) => {
      return SupabaseStorage.uploadFile(file, userId, tags)
    },
    delete: async (fileId: string, userId: string) => {
      return SupabaseStorage.deleteFile(fileId, userId)
    }
  }
}
