"use client"

import React from "react"
import Image from "next/image"
import { useCallback, useState } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Download, Trash2, Pencil, ChevronRight, ChevronDown, Folder, File } from "lucide-react"
import { kindIcon } from "./file-kind"
import TagInput from "./tag-input"
import { db, useLiveFiles } from "../lib/db"
import { supabase } from "../lib/supabase"
import { useAuth } from "./auth"
import JSZip from "jszip"

export type StoredFile = {
  id: string
  name: string
  type?: string
  size: number
  tags: string[]
  createdAt: string
  ext?: string
  kind: string
  path: string
  url?: string
  user_id: string
}

type FolderNode = {
  type: 'folder'
  name: string
  path: string
  children: { [key: string]: FolderNode | FileNode }
}

type FileNode = {
  type: 'file'
  file: StoredFile
}

function buildFolderStructure(files: StoredFile[]): { [key: string]: FolderNode | FileNode } {
  const root: { [key: string]: FolderNode | FileNode } = {}

  files.forEach(file => {
    const pathParts = file.name.split('/')
    let current = root

    // Navigate/create folder structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i]
      if (!current[folderName]) {
        current[folderName] = {
          type: 'folder',
          name: folderName,
          path: pathParts.slice(0, i + 1).join('/'),
          children: {}
        }
      }
      current = (current[folderName] as FolderNode).children
    }

    // Add file
    const fileName = pathParts[pathParts.length - 1]
    current[fileName] = {
      type: 'file',
      file: { ...file, name: fileName }
    }
  })

  return root
}

function FolderRow({ folder, isExpanded, onToggle, depth }: {
  folder: FolderNode
  isExpanded: boolean
  onToggle: () => void
  depth: number
}) {
  const { user } = useAuth()

  const downloadFolder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    
    try {
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .like('name', `${folder.path}%`)
      
      if (files && files.length > 0) {
        const zip = new JSZip()
        
        for (const file of files) {
          if (file.url) {
            try {
              const response = await fetch(file.url)
              const blob = await response.blob()
              const relativePath = file.name.replace(folder.path + '/', '')
              zip.file(relativePath, blob)
            } catch (err) {
              console.error(`Failed to add ${file.name} to zip:`, err)
            }
          }
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${folder.name}.zip`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading folder:', error)
    }
  }

  const deleteFolder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    
    try {
      const { data: files } = await supabase
        .from('files')
        .select('id, path')
        .eq('user_id', user.id)
        .like('name', `${folder.path}%`)
      
      if (files && files.length > 0) {
        const filePaths = files.map(f => f.path)
        const fileIds = files.map(f => f.id)
        
        await supabase.storage.from('files').remove(filePaths)
        await supabase.from('files').delete().in('id', fileIds)
      }
      
      window.location.reload()
    } catch (error) {
      console.error('Error deleting folder:', error)
    }
  }

  return (
    <div 
      className="group flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md"
      style={{ paddingLeft: `${depth * 20 + 12}px` }}
    >
      <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={onToggle}>
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Folder className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">{folder.name}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={downloadFolder}>
          <Download className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={deleteFolder}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

function FileRow({ file, isEditing, onStartEdit, onStopEdit, depth }: {
  file: StoredFile
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
  depth: number
}) {
  const Icon = kindIcon(file.kind as any)
  
  const download = useCallback(() => {
    if (file.url) {
      const a = document.createElement("a")
      a.href = file.url
      a.download = file.name
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  }, [file])

  const remove = useCallback(async () => {
    await db.files.delete(file.id, file.user_id)
  }, [file])

  return (
    <div className="group">
      <div 
        className="flex items-center gap-2 py-2 px-3 hover:bg-muted/30 rounded-md"
        style={{ paddingLeft: `${depth * 20 + 32}px` }}
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm truncate">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatSize(file.size)}
            </span>
          </div>
          {file.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {file.tags.map((tag, index) => (
                <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onStartEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={download}>
            <Download className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={remove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {isEditing && (
        <div className="px-3 py-2 bg-muted/20" style={{ paddingLeft: `${depth * 20 + 32}px` }}>
          <TagInput
            value={file.tags}
            onChange={async (tags) => {
              onStopEdit()
            }}
          />
          <Button variant="ghost" size="sm" onClick={onStopEdit} className="mt-2">
            Done
          </Button>
        </div>
      )}
    </div>
  )
}

function renderStructure(
  structure: { [key: string]: FolderNode | FileNode },
  parentPath: string,
  expandedFolders: Set<string>,
  toggleFolder: (path: string) => void,
  editingId: string | null,
  setEditingId: (id: string | null) => void
): React.ReactNode {
  return Object.entries(structure)
    .sort(([, a], [, b]) => {
      if (a.type === 'folder' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'folder') return 1
      return a.type === 'folder' ? a.name.localeCompare(b.name) : a.file.name.localeCompare(b.file.name)
    })
    .map(([key, node]) => {
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.has(node.path)
        return (
          <div key={node.path}>
            <FolderRow
              folder={node}
              isExpanded={isExpanded}
              onToggle={() => toggleFolder(node.path)}
              depth={parentPath.split('/').filter(Boolean).length}
            />
            {isExpanded && (
              <div>
                {renderStructure(node.children, node.path, expandedFolders, toggleFolder, editingId, setEditingId)}
              </div>
            )}
          </div>
        )
      } else {
        return (
          <FileRow
            key={node.file.id}
            file={node.file}
            isEditing={editingId === node.file.id}
            onStartEdit={() => setEditingId(node.file.id)}
            onStopEdit={() => setEditingId(null)}
            depth={parentPath.split('/').filter(Boolean).length}
          />
        )
      }
    })
}

export default function FileList({ files = [] as StoredFile[] }: { files?: StoredFile[] } = { files: [] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const { isLoading } = useLiveFiles()
  const { user } = useAuth()

  if (!files.length) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <div className="text-sm font-medium">{"Your library is empty"}</div>
        <div className="text-xs text-muted-foreground">Click "Fill with Files and Codes" to upload anything.</div>
      </div>
    )
  }

  // Build folder structure
  const structure = buildFolderStructure(files)

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  return (
    <div className="space-y-1">
      {renderStructure(structure, '', expandedFolders, toggleFolder, editingId, setEditingId)}
    </div>
  )
}

function formatSize(size: number) {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let s = size
  let i = 0
  while (s >= 1024 && i < units.length - 1) {
    s = s / 1024
    i++
  }
  return `${s.toFixed(1)} ${units[i]}`
}