"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, Smile, ThumbsUp, Mic } from "lucide-react"
import { sendMessage } from "@/lib/actions/messages"
import { useToast } from "@/hooks/use-toast"

interface MessageInputProps {
  recipientId: string
  onMessageSent?: () => void
}

export function MessageInput({ recipientId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    setIsLoading(true)
    try {
      const result = await sendMessage({
        recipientId,
        content: message,
      })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setMessage("")
      if (onMessageSent) onMessageSent()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex items-center gap-2 p-4">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <Paperclip className="h-4 w-4" />
      </Button>
      
      <div className="flex-1 relative">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Aa"
          className="pr-12 bg-gray-100 border-0 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-full"
          disabled={isLoading}
        />
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </div>

      {message.trim() ? (
        <Button 
          type="submit" 
          size="sm" 
          onClick={handleSubmit}
          disabled={isLoading}
          className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"
        >
          <Send className="h-4 w-4 text-white" />
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <ThumbsUp className="h-4 w-4" />
        </Button>
      )}

      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <Mic className="h-4 w-4" />
      </Button>
    </div>
  )
}
