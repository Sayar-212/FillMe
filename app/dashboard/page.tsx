"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Badge } from "../../components/ui/badge"
import { ScrollArea } from "../../components/ui/scroll-area"
import { Plus, LogOut, Search, Filter, Loader2 } from "lucide-react"
import GradientBG from "../../components/gradient-bg"
import { useAuth } from "../../components/auth"
import UploadModal from "../../components/upload-modal"
import { useLiveFiles } from "../../lib/db"
import type { FileKind } from "../../components/file-kind"
import FileList from "../../components/file-list"

export default function DashboardPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [kind, setKind] = useState<FileKind | "all">("all")
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    // In mock auth, user loads from localStorage on mount
    const t = setTimeout(() => setLoadingUser(false), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace("/")
    }
  }, [loadingUser, user, router])

  const { files, isLoading, totalStorage } = useLiveFiles()
  
  const maxStorage = 100 * 1024 * 1024 // 100MB
  const isOverLimit = totalStorage > maxStorage

  const extractKeywords = (text: string): string[] => {
    const stopWords = ['i', 'have', 'an', 'exam', 'tomorrow', 'on', 'the', 'a', 'for', 'me', 'all', 'files', 'retrieve', 'get', 'find', 'show']
    return text.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !stopWords.includes(word.toLowerCase()))
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return files.filter((f) => {
      const kindOk = kind === "all" ? true : f.kind === kind
      if (!query) return kindOk
      
      const searchText = `${f.name} ${f.ext ?? ""} ${(f.tags ?? []).join(" ")} ${f.type ?? ""}`.toLowerCase()
      
      // Smart search: extract keywords and match
      const keywords = extractKeywords(query)
      const hasKeywordMatch = keywords.length > 0 && keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
      
      // Regular search: direct text match
      const hasDirectMatch = searchText.includes(query)
      
      return kindOk && (hasDirectMatch || hasKeywordMatch)
    })
  }, [files, q, kind])

  if (loadingUser) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="sr-only">{"Loading"}</span>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      <GradientBG subtle />
      <div className="relative z-10 flex min-h-[100svh] flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
            <div className="mr-auto flex items-center gap-3">
              <img 
                src="https://i.ibb.co/bj0kyZK2/logo.png" 
                alt="FillMe Logo" 
                className="h-8 w-8 object-contain"
              />
              <div>
                <div className="text-sm text-muted-foreground">{"Welcome back"}</div>
                <h2 className="text-lg font-semibold leading-tight md:text-xl">{"FillMe Dashboard"}</h2>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full bg-transparent" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              {"Sign out"}
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 md:px-6 md:pb-32">
          <div className="mb-4 grid gap-3 md:mb-6 md:grid-cols-[1fr,220px]">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={"Search files or ask: 'I have exam on Project Policynth'"}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 rounded-lg border px-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="Filter kind" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{"All kinds"}</SelectItem>
                    <SelectItem value="code">{"Code"}</SelectItem>
                    <SelectItem value="archive">{"Archive"}</SelectItem>
                    <SelectItem value="image">{"Image"}</SelectItem>
                    <SelectItem value="video">{"Video"}</SelectItem>
                    <SelectItem value="audio">{"Audio"}</SelectItem>
                    <SelectItem value="document">{"Document"}</SelectItem>
                    <SelectItem value="pdf">{"PDF"}</SelectItem>
                    <SelectItem value="other">{"Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Storage Warning */}
          {isOverLimit && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
              <div className="flex items-start gap-3">
                <div className="text-red-500">
                  ⚠️
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 dark:text-red-200">
                    Storage Limit Exceeded!
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    You're using {(totalStorage / 1024 / 1024).toFixed(2)}MB out of 100.00MB. 
                    Since it's the start and we're on free tiers, please delete heavy files or some files may be lost! 💸
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {filtered.length} {"files"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {isLoading ? "Loading your library..." : `${((totalStorage || 0) / 1024 / 1024).toFixed(2)}MB / 100.00MB used`}
              </span>
            </div>
          </div>

          <ScrollArea className="h-[calc(100svh-240px)] rounded-lg border">
            <div className="p-4">
              <FileList files={filtered} />
            </div>
          </ScrollArea>
        </main>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-end justify-center pb-8">
          <div className="pointer-events-auto">
            <Button
              size="lg"
              className="group relative flex items-center gap-2 rounded-full px-5 shadow-lg transition-transform active:scale-95"
              onClick={() => setOpen(true)}
            >
              <Plus className="h-5 w-5" />
              {"Fill with Files and Codes"}
            </Button>
          </div>
        </div>

        <UploadModal 
          open={open} 
          onOpenChange={setOpen} 
          currentStorage={totalStorage}
          maxStorage={maxStorage}
        />
      </div>
    </div>
  )
}
