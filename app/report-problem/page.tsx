"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flag, Send, Loader2, LifeBuoy, Mail } from "lucide-react"
import { MainLayout } from "@/components/layouts/main-layout"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ReportProblemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    description: "",
    email: ""
  })

  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const response = await fetch("/api/auth/get-user-profile", {
          credentials: "include",
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        const userEmail = data?.user?.email || data?.profile?.email || ""

        if (userEmail) {
          setFormData((prev) => ({
            ...prev,
            email: userEmail,
          }))
        }
      } catch (error) {
        // Leave the field empty if the profile lookup fails.
      }
    }

    loadUserEmail()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category || !formData.subject || !formData.description || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/support/submit-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: `Support ticket submitted successfully! Ticket ID: #${data.ticketId}`,
        })
        
        // Reset form
        setFormData({
          category: "",
          subject: "",
          description: "",
          email: ""
        })
        
        // Redirect to support inbox after a short delay
        setTimeout(() => {
          router.push("/support-inbox")
        }, 2000)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to submit support ticket",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="container max-w-xl mx-auto py-10 px-4">
      <div className="mb-8 space-y-4 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            <LifeBuoy className="h-3.5 w-3.5" />
            Support
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Report a problem</h1>
          <p className="mx-auto max-w-md text-sm leading-6 text-gray-600">
            Tell us what happened and we&apos;ll review it with the right context.
          </p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Flag className="h-4 w-4 text-blue-600" />
            Problem report
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger className="w-full min-w-0 border-x-0 border-t-0 border-b-[3px] border-b-blue-600 focus-visible:border-b-blue-600 rounded-none bg-transparent">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="payment">Payment Problem</SelectItem>
                  <SelectItem value="account">Account Issue</SelectItem>
                  <SelectItem value="loan">Loan Application</SelectItem>
                  <SelectItem value="security">Security Concern</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject *</Label>
              <Input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="Brief description of the problem"
                className="w-full border-x-0 border-t-0 border-b-3 rounded-none bg-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Details *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Explain what happened, what you expected, and any error message you saw."
                rows={5}
                className="w-full min-w-0 resize-none border-x-0 border-t-0 border-b-[3px] border-b-blue-600 focus-visible:border-b-blue-600 rounded-none bg-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Contact email</Label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                readOnly
                placeholder="Loading your account email..."
                className="w-full border-x-0 border-t-0 border-b-3 rounded-none bg-transparent"
                required
              />
              <p className="flex items-center gap-2 text-xs text-gray-500">
                <Mail className="h-3.5 w-3.5" />
                We use the email on your account so we can reply to you directly.
              </p>
            </div>

            <div className="flex flex-col-reverse items-center justify-center gap-3 pt-3 sm:flex-row">
              <Button 
                type="submit" 
                className="h-10 rounded-lg px-5 flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
                <Button variant="outline" asChild disabled={isSubmitting} className="h-10 rounded-lg px-5 border-gray-200">
                <Link href="/account-status">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Need immediate help? Check our{" "}
          <Link href="/faq" className="text-blue-600 hover:underline">
            Help Center
          </Link>{" "}
          for quick answers.
        </p>
      </div>
    </div>
  )
}
