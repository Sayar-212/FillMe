"use client"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { MessageCircle, Search, X } from "lucide-react"
import type { StoredFile } from "../lib/storage"

interface SmartSearchProps {
  files: StoredFile[]
  onFilesFiltered: (files: StoredFile[]) => void
}

export function SmartSearch({ files, onFilesFiltered }: SmartSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StoredFile[]>([])

  const smartSearch = (input: string) => {
    const query = input.toLowerCase()
    
    // Extract keywords from natural language
    const keywords = extractKeywords(query)
    
    const filtered = files.filter(file => {
      const searchText = `${file.name} ${file.tags?.join(' ')} ${file.ext}`.toLowerCase()
      
      // Check if any keyword matches
      return keywords.some(keyword => searchText.includes(keyword))
    })

    setResults(filtered)
    onFilesFiltered(filtered)
    
    return filtered
  }

  const extractKeywords = (text: string): string[] => {
    // Remove common words and extract meaningful keywords
    const stopWords = ['i', 'have', 'an', 'exam', 'tomorrow', 'on', 'the', 'a', 'for', 'me', 'all', 'files', 'retrieve', 'get', 'find', 'show']
    
    const words = text.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !stopWords.includes(word))
    
    return words
  }

  const handleSearch = () => {
    if (!query.trim()) return
    smartSearch(query)
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    onFilesFiltered(files) // Show all files
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 rounded-full shadow-lg z-40"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Smart Search
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-20 right-6 w-80 shadow-lg z-40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Smart File Search</h3>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Try: "I have exam tomorrow on Project Policynth"
        </div>
        
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask for files..."
            className="text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {results.length} files found
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearSearch} className="text-xs">
                Clear
              </Button>
            </div>
            
            <div className="max-h-32 overflow-y-auto space-y-1">
              {results.slice(0, 5).map((file) => (
                <div key={file.id} className="text-xs p-2 bg-muted rounded">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-muted-foreground">
                    {file.tags?.slice(0, 3).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {query && results.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No files found. Try different keywords.
          </div>
        )}
      </CardContent>
    </Card>
  )
}