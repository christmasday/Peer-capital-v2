"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flag, Send, ArrowLeft, Loader2 } from "lucide-react"
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
    <div className="container max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/account-status">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report a Problem</h1>
        <p className="text-gray-600">Help us improve by reporting any issues you encounter</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Problem Report Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Problem Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="subject">Subject *</Label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="Brief description of the problem"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Please provide a detailed description of the problem you're experiencing. Include any error messages, steps to reproduce, and what you were trying to do when the problem occurred."
                rows={6}
                className="resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact Email *</Label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Your email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex items-center gap-2"
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
              <Button variant="outline" asChild disabled={isSubmitting}>
                <Link href="/account-status">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
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
