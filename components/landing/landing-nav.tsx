"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { motion } from "framer-motion"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <motion.header
        className="border-b bg-white sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <Logo width={110} height={10} className="w-32 md:w-auto" href="/" />

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/login" className="text-sm font-medium hover:text-primary">
                Log in
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden bg-white"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col py-4 px-4 space-y-4 border-t">
              <Link
                href="/login"
                className="text-base font-medium hover:text-primary py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Button asChild className="w-full justify-center" onClick={() => setMobileMenuOpen(false)}>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </motion.header>
    </>
  )
}
