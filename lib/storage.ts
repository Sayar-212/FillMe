import { supabase } from './supabase'

export type StoredFile = {
  id: string
  name: string
  type?: string
  size: number
  tags: string[]
  createdAt: string
  created_at?: string
  ext?: string
  kind: string
  path: string
  url?: string
  user_id: string
}

const BUCKET_NAME = 'files'

export class SupabaseStorage {
  static async uploadFile(file: File, userId: string, tags: string[] = []): Promise<StoredFile> {
    // Check file size - be honest about our poverty 😅
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      throw new Error(`🚀 Whoa there! That ${(file.size / 1024 / 1024).toFixed(1)}MB file is HUGE! Unfortunately, I'm currently too poor to handle files over 50MB. Once I get rich, we'll make storage limits INFINITE! 💰✨ (For now, try splitting it up or compressing it)`)
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `${userId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file)

    if (uploadError) {
      // Handle storage quota exceeded
      if (uploadError.message?.includes('exceeded') || uploadError.message?.includes('quota')) {
        throw new Error(`💸 Oops! My storage piggy bank is empty! I've hit my free tier limits because I'm broke AF. Soon I'll upgrade and we'll have UNLIMITED space! 🐷💰`)
      }
      throw uploadError
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const fileRecord = {
      name: file.name,
      type: file.type,
      size: file.size,
      tags,
      ext: fileExt,
      kind: this.getFileKind(file.type, fileExt),
      path: filePath,
      url: urlData.publicUrl,
      user_id: userId
    }

    const { data, error } = await supabase
      .from('files')
      .insert(fileRecord)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getFiles(userId: string): Promise<StoredFile[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data?.map(file => ({
      ...file,
      createdAt: file.created_at
    })) || []
  }

  static async deleteFile(fileId: string, userId: string): Promise<void> {
    const { data: file } = await supabase
      .from('files')
      .select('path')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single()

    if (file) {
      await supabase.storage.from(BUCKET_NAME).remove([file.path])
      await supabase.from('files').delete().eq('id', fileId).eq('user_id', userId)
    }
  }

  private static getFileKind(type?: string, ext?: string): string {
    if (type?.startsWith('image/')) return 'image'
    if (type?.startsWith('video/')) return 'video'
    if (type?.startsWith('audio/')) return 'audio'
    if (ext === 'pdf' || type?.includes('pdf')) return 'pdf'
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c'].includes(ext || '')) return 'code'
    if (['txt', 'md', 'doc', 'docx'].includes(ext || '')) return 'document'
    return 'other'
  }
}