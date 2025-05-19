"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EditBioModal } from "./edit-bio-modal"

interface EditBioButtonProps {
  userId: string
  currentBio: string
}

export function EditBioButton({ userId, currentBio }: EditBioButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [bio, setBio] = useState(currentBio)

  const handleBioUpdated = (newBio: string) => {
    setBio(newBio)
  }

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setIsModalOpen(true)}>
        Edit bio
      </Button>

      <EditBioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentBio={bio}
        userId={userId}
        onBioUpdated={handleBioUpdated}
      />
    </>
  )
}
