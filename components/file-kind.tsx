"use client"

import { Code2, Archive, ImageIcon, FileAudio2, FileVideo2, FileText, FileIcon } from "lucide-react"

export type FileKind = "code" | "archive" | "image" | "video" | "audio" | "document" | "pdf" | "other"

export function inferKind(mime: string | undefined, name: string): FileKind {
  const n = name.toLowerCase()
  if (mime?.startsWith("image/")) return "image"
  if (mime?.startsWith("video/")) return "video"
  if (mime?.startsWith("audio/")) return "audio"
  if (/(\.zip|\.rar|\.7z|\.tar|\.gz|\.bz2)$/.test(n)) return "archive"
  if (/\.pdf$/.test(n)) return "pdf"
  if (/(\.md|\.docx?|\.xlsx?|\.pptx?|\.txt|\.rtf)$/.test(n)) return "document"
  if (
    /(\.js|\.ts|\.tsx|\.jsx|\.py|\.rb|\.go|\.rs|\.java|\.c|\.cpp|\.cs|\.php|\.sh|\.yaml|\.yml|\.json|\.toml|\.ini|\.sql)$/.test(
      n,
    )
  )
    return "code"
  return "other"
}

export function kindIcon(kind: FileKind) {
  switch (kind) {
    case "image":
      return ImageIcon
    case "video":
      return FileVideo2
    case "audio":
      return FileAudio2
    case "archive":
      return Archive
    case "document":
      return FileText
    case "pdf":
      return FileText
    case "code":
      return Code2
    default:
      return FileIcon
  }
}
