"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Badge } from "../components/ui/badge"
import TagInput from "../components/tag-input"
import { FolderPlus, Folder, Trash2, Download, Pencil } from "lucide-react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../components/auth"

interface Folder {
  id: string
  name: string
  tags: string[]
  auto_extensions: string[]
  created_at: string
}

export function FolderManager() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [extensions, setExtensions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadFolders = async () => {
    if (!user) return
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setFolders(data || [])
  }

  useEffect(() => {
    if (user) loadFolders()
  }, [user])

  const handleCreate = async () => {
    if (!user || !name.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('folders')
        .insert({
          name: name.trim(),
          tags,
          auto_extensions: extensions,
          user_id: user.id
        })

      if (error) throw error

      setName("")
      setTags([])
      setExtensions([])
      setOpen(false)
      loadFolders()
    } catch (error) {
      console.error('Error creating folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (folderId: string) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id)

      if (error) throw error
      loadFolders()
    } catch (error) {
      console.error('Error deleting folder:', error)
    }
  }

  const handleDownload = async (folderId: string) => {
    if (!user) return
    
    try {
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId)
        .eq('user_id', user.id)
      
      if (files && files.length > 0) {
        files.forEach(file => {
          if (file.url) {
            const a = document.createElement('a')
            a.href = file.url
            a.download = file.name
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            a.remove()
          }
        })
      }
    } catch (error) {
      console.error('Error downloading folder:', error)
    }
  }

  const handleUpdateTags = async (folderId: string, newTags: string[]) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('folders')
        .update({ tags: newTags })
        .eq('id', folderId)
        .eq('user_id', user.id)

      if (error) throw error
      loadFolders()
      setEditingId(null)
    } catch (error) {
      console.error('Error updating folder:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Smart Folders</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Smart Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Music, Videos, Code"
                />
              </div>
              
              <div>
                <Label>Tags (for classification)</Label>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="Add tags like mp3, video, code..."
                />
              </div>
              
              <div>
                <Label>Auto-sort Extensions</Label>
                <TagInput
                  value={extensions}
                  onChange={setExtensions}
                  placeholder="Add extensions like .mp3, .mp4, .js, .py..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Files with these extensions will auto-sort into this folder
                </p>
              </div>
              
              <Button onClick={handleCreate} disabled={loading || !name.trim()} className="w-full">
                {loading ? "Creating..." : "Create Folder"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <div key={folder.id} className="group border rounded-lg p-4 space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{folder.name}</span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(folder.id)}
                  className="h-6 w-6 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(folder.id)}
                  className="h-6 w-6 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(folder.id)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {editingId === folder.id ? (
              <div className="space-y-2">
                <TagInput
                  value={folder.tags}
                  onChange={(newTags) => handleUpdateTags(folder.id, newTags)}
                  placeholder="Edit tags..."
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(null)}
                  className="text-xs"
                >
                  Done
                </Button>
              </div>
            ) : (
              folder.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {folder.tags.map((tag, index) => (
                    <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )
            )}
            
            {folder.auto_extensions.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Auto-sorts: {folder.auto_extensions.join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}