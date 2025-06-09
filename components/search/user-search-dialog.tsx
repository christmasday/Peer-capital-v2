"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Loader2, UserRound } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { searchUsers } from "@/lib/actions/search"

type UserSearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UserSearchResult = {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
}

export function UserSearchDialog({ open, onOpenChange }: UserSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    // Reset results when dialog closes
    if (!open) {
      setResults([])
      setSearchQuery("")
      setError(null)
    }
  }, [open])

  useEffect(() => {
    const performSearch = async () => {
      // Don't search if dialog is closed or query is too short
      if (!open || !debouncedSearch || debouncedSearch.length < 2) {
        if (debouncedSearch.length < 2) {
          setResults([])
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const searchResults = await searchUsers(debouncedSearch)
        setResults(searchResults)
      } catch (err) {
        setError("An error occurred while searching. Please try again.")
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedSearch, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleResultClick = (userId: string) => {
    router.push(`/profile/${userId}`)
    onOpenChange(false)
  }

  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "U"

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email"
            className="pl-8"
            value={searchQuery}
            onChange={handleInputChange}
            autoFocus
          />
        </div>

        <div className="mt-4 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-destructive">{error}</div>
          ) : results.length === 0 && searchQuery.length >= 2 ? (
            <div className="text-center py-4 text-muted-foreground">No users found matching "{searchQuery}"</div>
          ) : (
            <ul className="space-y-2">
              {results.map((result) => (
                <li
                  key={result.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleResultClick(result.id)}
                >
                  <Avatar className="h-10 w-10">
                    {result.avatarUrl ? (
                      <AvatarImage src={result.avatarUrl || "/placeholder.svg"} alt={result.displayName} />
                    ) : (
                      <AvatarFallback>
                        <UserRound className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{result.displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">{result.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
