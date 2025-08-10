"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"
import { UploadCloud, FolderOpen, CheckCircle2, FileUp, Loader2, X, Wand2 } from "lucide-react"
import { db } from "../lib/db"
import { inferKind } from "./file-kind"
import { useAuth } from "./auth"

type Props = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  currentStorage?: number
  maxStorage?: number
}

type Incoming = {
  file: File
  path?: string
}

export default function UploadModal({ open = false, onOpenChange, currentStorage = 0, maxStorage = 100 * 1024 * 1024 }: Props = { open: false, onOpenChange: () => {} }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [queue, setQueue] = useState<Incoming[]>([])
  const [saving, setSaving] = useState(false)
  const [doneCount, setDoneCount] = useState(0)
  
  // Calculate queue size
  const queueSize = useMemo(() => {
    return queue.reduce((total, { file }) => total + file.size, 0)
  }, [queue])
  
  const wouldExceedLimit = currentStorage + queueSize > maxStorage

  useEffect(() => {
    if (!open) {
      setQueue([])
      setSaving(false)
      setDoneCount(0)
    }
  }, [open])

  const onFiles = useCallback((files: Incoming[]) => {
    setQueue((prev) => [...prev, ...files])
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      const items = e.dataTransfer?.items
      if (!items) return
      const collected: Incoming[] = []
      const traverseEntry = async (entry: any, path = "") => {
        if (entry.isFile) {
          await new Promise<void>((resolve) => {
            entry.file((file: File) => {
              collected.push({ file, path: path || entry.name })
              resolve()
            })
          })
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader()
          await new Promise<void>((resolve) => {
            const readEntries = () => {
              dirReader.readEntries(async (entries: any[]) => {
                if (!entries.length) return resolve()
                for (const ent of entries) {
                  await traverseEntry(ent, path ? `${path}/${entry.name}` : entry.name)
                }
                readEntries()
              })
            }
            readEntries()
          })
        }
      }
      // Prefer webkitGetAsEntry for folders
      const entries = Array.from(items)
        .map((it) => (typeof (it as any).webkitGetAsEntry === "function" ? (it as any).webkitGetAsEntry() : null))
        .filter(Boolean)

      if (entries.length) {
        for (const entry of entries) {
          await traverseEntry(entry)
        }
        onFiles(collected)
      } else {
        const plainFiles = Array.from(e.dataTransfer.files).map((f) => ({
          file: f,
          path: (f as any).webkitRelativePath || "",
        }))
        onFiles(plainFiles)
      }
    },
    [onFiles],
  )

  const { user } = useAuth()

  const beginSave = useCallback(async () => {
    if (!queue.length || !user) return
    setSaving(true)
    setDoneCount(0)
    
    try {
      // Save sequentially to keep UI simple
      for (const { file, path } of queue) {
        const ext = (file.name.split(".").pop() || "").toLowerCase()
        const kind = inferKind(file.type, file.name)
        const fileName = path || file.name
        const fileWithPath = new File([file], fileName, { type: file.type })
        await db.files.add(fileWithPath, user.id, autoTags(kind, ext))
        setDoneCount((c) => c + 1)
      }
      setSaving(false)
      setQueue([])
      onOpenChange?.(false)
    } catch (error: any) {
      setSaving(false)
      // Show the funny error message
      alert(error.message || "Upload failed! Something went wrong.")
    }
  }, [queue, onOpenChange, user])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 pb-4">
            <div>
              <h2 className="text-lg font-semibold">Upload Files</h2>
              <p className="text-sm text-muted-foreground">Drag & drop files or folders, or pick from your device.</p>
            </div>
          </div>

          <div className="px-6">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              )}
            >
              <UploadCloud className={cn("h-10 w-10 mx-auto mb-3", dragOver ? "text-primary" : "text-muted-foreground")} />
              <p className="text-sm font-medium mb-1">Drop files or folders here</p>
              <p className="text-xs text-muted-foreground mb-4">Support for all file types</p>
              
              <div className="flex justify-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                  <FileUp className="mr-2 h-4 w-4" />
                  Choose Files
                </Button>
                <Button variant="outline" size="sm" onClick={() => folderInputRef.current?.click()}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Choose Folder
                </Button>
              </div>
              
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []).map((f) => ({
                    file: f,
                    path: f.name,
                  }))
                  onFiles(files)
                  e.currentTarget.value = ""
                }}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                webkitdirectory="true"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []).map((f) => ({
                    file: f,
                    path: (f as any).webkitRelativePath || f.name,
                  }))
                  onFiles(files)
                  e.currentTarget.value = ""
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-6">
            {queue.length > 0 && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">
                    {queue.length} file{queue.length !== 1 ? 's' : ''} ready
                  </span>
                  <span className={wouldExceedLimit ? "text-red-500 text-sm font-medium" : "text-sm text-muted-foreground"}>
                    {((currentStorage + queueSize) / 1024 / 1024).toFixed(2)} / 100MB
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto border rounded-lg">
                  {queue.map(({ file, path }, idx) => (
                    <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      
                      {saving && idx < doneCount ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : saving && idx === doneCount ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setQueue(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {wouldExceedLimit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-red-700">
                      ⚠️ Would exceed 100MB limit. Remove some files to continue.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t p-6 pt-4">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                Cancel
              </Button>
              <Button disabled={!queue.length || saving || wouldExceedLimit} onClick={beginSave}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload {queue.length > 0 && `(${queue.length})`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`
  } else {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }
}

function autoTags(kind: string, ext: string) {
  const tags = [kind]
  if (ext) tags.push(ext)
  return tags
}
