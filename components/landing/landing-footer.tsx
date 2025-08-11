"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"
import { motion } from "framer-motion"
import { ManageCookiesButton } from "@/components/cookie/manage-cookies-button"

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="col-span-2 md:col-span-1"
          >
            <Logo className="invert opacity-90" width={120} height={40} href="/" />
            <p className="mt-4 text-xs md:text-sm">
              Peer Capital is revolutionizing the way people borrow and lend money.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="font-semibold text-white text-sm md:text-base mb-3 md:mb-4">Company</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/about-us" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white">
                  Press
                </Link>
              </li>
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="font-semibold text-white text-sm md:text-base mb-3 md:mb-4">Resources</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white" prefetch={false}>
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white" prefetch={false}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="font-semibold text-white text-sm md:text-base mb-3 md:mb-4">Legal</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-white">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimers" className="hover:text-white">
                  Financial Disclaimers
                </Link>
              </li>
              <li>
                <Link href="/risk-disclosure" className="hover:text-white">
                  Risk Disclosure
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="hover:text-white">
                  Acceptable Use Policy
                </Link>
              </li>
              <li>
                <ManageCookiesButton variant="default" />
              </li>
            </ul>
          </motion.div>
        </div>
        <motion.div
          className="border-t border-gray-800 mt-8 md:mt-12 pt-6 md:pt-8 text-xs md:text-sm text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="mt-3 text-gray-400">
            Peer capital is a financial technology company, not a bank. Money remittance and banking services are provided by our partner licensed financial institution.
          </p>
          <p>&copy; {new Date().getFullYear()} Peer Capital. All rights reserved.</p>
          
        </motion.div>
      </div>
    </footer>
  )
}
