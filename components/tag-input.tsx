"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { X } from "lucide-react"
import { cn } from "../lib/utils"

export default function TagInput(
  {
    value = [],
    onChange,
    placeholder = "Add a tag and press Enter",
    className,
  }: {
    value?: string[]
    onChange?: (tags: string[]) => void
    placeholder?: string
    className?: string
  } = { value: [], onChange: undefined, placeholder: "Add a tag and press Enter", className: "" },
) {
  const [tags, setTags] = useState<string[]>(value ?? [])
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => setTags(value ?? []), [value])

  const commit = (t: string) => {
    const clean = t.trim()
    if (!clean) return
    const next = Array.from(new Set([...tags, clean]))
    setTags(next)
    onChange?.(next)
    setDraft("")
  }

  const remove = (t: string) => {
    const next = tags.filter((x) => x !== t)
    setTags(next)
    onChange?.(next)
  }

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border bg-background px-2 py-2 focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((t) => (
        <Badge key={t} variant="secondary" className="gap-1 rounded-full">
          {t}
          <button
            className="ml-1 rounded-full p-0.5 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation()
              remove(t)
            }}
            aria-label={`Remove tag ${t}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit(draft)
          } else if (e.key === "Backspace" && !draft && tags.length) {
            remove(tags[tags.length - 1])
          }
        }}
        placeholder={placeholder}
        className="h-6 flex-1 border-0 px-0 shadow-none focus-visible:ring-0"
      />
    </div>
  )
}
