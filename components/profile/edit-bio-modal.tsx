"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { updateBio } from "@/lib/actions/profile"

interface EditBioModalProps {
  isOpen: boolean
  onClose: () => void
  currentBio: string
  userId: string
  onBioUpdated: (newBio: string) => void
}

export function EditBioModal({ isOpen, onClose, currentBio, userId, onBioUpdated }: EditBioModalProps) {
  const [bio, setBio] = useState(currentBio || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const maxLength = 140 // Reduced from 250 to 140 characters

  const handleSubmit = async () => {
    if (bio.trim() === currentBio) {
      onClose()
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateBio(userId, bio.trim())

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      toast({
        title: "Bio Updated",
        description: "Your bio has been updated successfully!",
      })

      onBioUpdated(bio.trim())
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bio. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bio</DialogTitle>
          <DialogDescription>
            Tell people about yourself in 140 characters or less. This will appear on your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, maxLength))}
            placeholder="Describe yourself..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end text-xs text-gray-500">
            <span
              className={
                bio.length > maxLength - 20 ? (bio.length > maxLength - 10 ? "text-red-600" : "text-amber-600") : ""
              }
            >
              {bio.length}/{maxLength} characters
            </span>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
