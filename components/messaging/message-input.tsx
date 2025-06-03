"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
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
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="resize-none min-h-[80px]"
        disabled={isLoading}
      />
      <Button type="submit" size="icon" disabled={isLoading || !message.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
