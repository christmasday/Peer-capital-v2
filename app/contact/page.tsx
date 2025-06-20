"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess("")
    setError("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess("Your message has been sent! We'll get back to you soon.")
        setForm({ name: "", email: "", subject: "", message: "" })
      } else {
        setError(data.error || "Failed to send message. Please try again later.")
      }
    } catch (err) {
      setError("Failed to send message. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Contact Us</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Have questions or need assistance? Our team is here to help. Choose the best way to reach us below.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center text-center">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <Mail className="h-6 w-6 text-blue-700" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Email Us</h3>
          <p className="text-gray-600 mb-4">We'll respond within 24 hours</p>
          <a href="mailto:support@peercapital.com" className="text-blue-600 hover:underline font-medium">
            support@peercapital.com
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center text-center">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <Phone className="h-6 w-6 text-blue-700" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Call Us</h3>
          <p className="text-gray-600 mb-4">Available Mon-Fri, 9am-5pm</p>
          <a href="tel:+2348000000000" className="text-blue-600 hover:underline font-medium">
            +234 800 000 0000
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center text-center">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <MessageSquare className="h-6 w-6 text-blue-700" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
          <p className="text-gray-600 mb-4">Chat with our support team</p>
          <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            Start Chat
          </Button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Your Name
              </label>
              <Input id="name" placeholder="Enter your full name" value={form.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email Address
              </label>
              <Input id="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium">
              Subject
            </label>
            <Input id="subject" placeholder="What is your message about?" value={form.subject} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium">
              Message
            </label>
            <Textarea id="message" placeholder="Type your message here..." rows={6} value={form.message} onChange={handleChange} />
          </div>

          {success && <div className="text-green-600 font-medium">{success}</div>}
          {error && <div className="text-red-600 font-medium">{error}</div>}

          <div className="flex justify-end">
            <Button type="submit" className="px-8" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold mb-3">Looking for answers?</h3>
        <p className="text-gray-600 mb-4">
          Check our comprehensive{" "}
          <Link href="/faq" className="text-blue-600 hover:underline">
            FAQ section
          </Link>{" "}
          for quick answers to common questions.
        </p>
      </div>
    </div>
  )
}
