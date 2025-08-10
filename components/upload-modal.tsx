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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 sm:max-w-4xl">
        <DialogHeader className="px-6 pb-0 pt-6">
          <DialogTitle>{"Upload to FillMe"}</DialogTitle>
          <DialogDescription>{"Drag & drop files or folders, or pick from your device."}</DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "mx-6 mt-4 rounded-lg border border-dashed p-8 transition-colors",
            dragOver ? "border-primary bg-primary/5" : "bg-muted/10",
          )}
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <UploadCloud className={cn("h-10 w-10", dragOver ? "text-primary" : "text-muted-foreground")} />
            <div className="space-y-1">
              <div className="text-sm font-medium">{"Drop files or folders here"}</div>
              <div className="text-xs text-muted-foreground">
                {"Code repos, ZIP/RAR archives, images, videos, audio, docs, and more."}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" className="rounded-full" onClick={() => inputRef.current?.click()}>
                <FileUp className="mr-2 h-4 w-4" />
                {"Choose Files"}
              </Button>
              <Button
                variant="outline"
                className="rounded-full bg-transparent"
                onClick={() => {
                  if (folderInputRef.current) {
                    folderInputRef.current.click()
                  }
                }}
                title={"Choose folder"}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                {"Choose Folder"}
              </Button>
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
                // @ts-ignore - non-standard but widely supported for folders
                webkitdirectory="true"
                directory="true"
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
        </div>

        <div className="mx-6 mt-4 mb-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Storage Bar - Always visible when files in queue */}
          {queue.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Storage Preview</span>
                <span className={wouldExceedLimit ? "text-red-600 font-medium" : "text-muted-foreground"}>
                  {((currentStorage + queueSize) / 1024 / 1024).toFixed(1)}MB / 100MB
                </span>
              </div>
              <div className="h-3 bg-background rounded-full overflow-hidden border">
                <div 
                  className={`h-full transition-all duration-300 ${
                    wouldExceedLimit ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(((currentStorage + queueSize) / maxStorage) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Current: {(currentStorage / 1024 / 1024).toFixed(1)}MB</span>
                <span>Queue: {(queueSize / 1024 / 1024).toFixed(1)}MB</span>
              </div>
              {wouldExceedLimit && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ⚠️ This upload would exceed your 100MB limit! Remove some files below to continue.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Upload Queue {queue.length > 0 && `(${queue.length} files)`}
            </div>
            {saving && (
              <div className="text-xs text-muted-foreground">
                {doneCount}/{queue.length} uploaded
              </div>
            )}
          </div>
          
          <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-background">
            {queue.length ? (
              <div className="divide-y">
                {queue.map(({ file, path }, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-medium">{file.name}</div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {(file.size / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </div>
                      {path && path !== file.name && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {(path || "").split("/").slice(0, -1).join("/")}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {saving && idx < doneCount ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : saving && idx === doneCount ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => {
                            setQueue(prev => prev.filter((_, i) => i !== idx))
                          }}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-center text-sm text-muted-foreground">
                <div>
                  <UploadCloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No files queued yet</p>
                  <p className="text-xs">Drop files above to get started</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 flex-shrink-0 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5" />
              {"Auto-tagging by file type and extension"}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange?.(false)}>
                <X className="mr-2 h-4 w-4" />
                {"Cancel"}
              </Button>
              <Button className="rounded-full" disabled={!queue.length || saving || wouldExceedLimit} onClick={beginSave}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {"Uploading..."}
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {"Upload"}
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

function autoTags(kind: string, ext: string) {
  const tags = [kind]
  if (ext) tags.push(ext)
  return tags
}
