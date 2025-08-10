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

        <div className="mx-6 mt-4 mb-6 space-y-4">
          {/* Simple Storage Indicator */}
          {queue.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {queue.length} file{queue.length !== 1 ? 's' : ''} • {(queueSize / 1024 / 1024).toFixed(1)}MB
              </span>
              <span className={wouldExceedLimit ? "text-red-500 font-medium" : "text-muted-foreground"}>
                {((currentStorage + queueSize) / 1024 / 1024).toFixed(1)} / 100MB
              </span>
            </div>
          )}

          {/* File List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {queue.length ? (
              queue.map(({ file, path }, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  </div>
                  
                  {saving && idx < doneCount ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : saving && idx === doneCount ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-500"
                      onClick={() => setQueue(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UploadCloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Drop files above or click to browse</p>
              </div>
            )}
          </div>

          {wouldExceedLimit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                ⚠️ Would exceed 100MB limit. Remove some files to continue.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
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
