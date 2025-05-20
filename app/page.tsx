"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { motion } from "framer-motion"
import { useInView } from "@/hooks/use-in-view"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { UserSearchDialog } from "@/components/search/user-search-dialog"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const featureVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
  hover: {
    y: -5,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.3 },
  },
}

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  },
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const heroSection = useInView({ threshold: 0.1 })
  const featuresSection = useInView({ threshold: 0.1 })
  const howItWorksSection = useInView({ threshold: 0.1 })
  const testimonialsSection = useInView({ threshold: 0.1 })
  const ctaSection = useInView({ threshold: 0.1 })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Search Dialog */}
      <UserSearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />

      {/* Navigation */}
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

      {/* Hero Section */}
      <section className="bg-gray-100 py-10 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12" ref={heroSection.ref}>
            <motion.div
              className="w-full md:w-1/2 space-y-4 md:space-y-6 text-center md:text-left"
              initial="hidden"
              animate={heroSection.isInView ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight"
                variants={fadeIn}
              >
                Peer-to-Peer Lending <span className="text-primary">Made Simple</span>
              </motion.h1>
              <motion.p className="text-base md:text-lg text-gray-600" variants={fadeIn}>
                Peer Capital connects borrowers with multiple lenders and helpers, Ensuring everyone has access to the
                funds they need to make life better.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-3 pt-2 md:pt-4 justify-center md:justify-start"
                variants={staggerContainer}
                initial="hidden"
                animate={heroSection.isInView ? "visible" : "hidden"}
              >
                <motion.div
                  variants={fadeIn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Button size="lg" asChild className="w-full sm:w-auto">
                    <Link href="/signup">Create an Account</Link>
                  </Button>
                </motion.div>
                <motion.div
                  variants={fadeIn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
            <motion.div
              className="w-full md:w-1/2 relative mt-8 md:mt-0"
              initial={{ opacity: 0, x: 100 }}
              animate={heroSection.isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/vibrant-street-market.png"
                  alt="Peer lending marketplace"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-transparent"
                  animate={{
                    background: [
                      "linear-gradient(to top right, rgba(30, 58, 138, 0.4), transparent)",
                      "linear-gradient(to top right, rgba(30, 58, 138, 0.5), transparent)",
                      "linear-gradient(to top right, rgba(30, 58, 138, 0.4), transparent)",
                    ],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                ></motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial="hidden"
            animate={featuresSection.isInView ? "visible" : "hidden"}
            variants={fadeIn}
            ref={featuresSection.ref}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">Why Choose Peer Capital</h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform offers unique advantages for both borrowers and lenders
            </p>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
            variants={staggerContainer}
            initial="hidden"
            animate={featuresSection.isInView ? "visible" : "hidden"}
          >
            {[
              {
                title: "Better Rates",
                description:
                  "Borrowers get lower interest rates while lenders earn higher returns than traditional banks offer.",
                icon: "💰",
              },
              {
                title: "Fast & Simple",
                description: "Quick application process with decisions typically made within 24 hours.",
                icon: "⚡",
              },
              {
                title: "Transparent",
                description: "No hidden fees or complicated terms. Everything is clear and upfront.",
                icon: "🔍",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 md:p-8 rounded-xl shadow-sm border transition-shadow"
                variants={featureVariants}
                whileHover="hover"
              >
                <motion.div
                  className="text-3xl md:text-4xl mb-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 + 0.3, duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial="hidden"
            animate={howItWorksSection.isInView ? "visible" : "hidden"}
            variants={fadeIn}
            ref={howItWorksSection.ref}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">How It Works</h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Getting started with Peer Capital is easy
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            animate={howItWorksSection.isInView ? "visible" : "hidden"}
          >
            {[
              {
                step: "1",
                title: "Create an Account",
                description: "Sign up and complete your profile with basic information.",
              },
              {
                step: "2",
                title: "Apply for a Loan",
                description: "Specify the amount you need and why you need it.",
              },
              {
                step: "3",
                title: "Get Funded",
                description: "Lenders review your application and fund your loan.",
              },
              {
                step: "4",
                title: "Repay on Schedule",
                description: "Make regular payments according to your loan terms.",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                className="relative flex flex-col items-center sm:items-start text-center sm:text-left"
                variants={stepVariants}
              >
                <motion.div
                  className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {step.step}
                </motion.div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm md:text-base text-gray-600">{step.description}</p>
                {index < 3 && (
                  <motion.div
                    className="hidden md:block absolute top-5 left-12 w-full h-0.5 bg-gray-200 -z-10"
                    initial={{ width: 0 }}
                    animate={howItWorksSection.isInView ? { width: "100%" } : { width: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  ></motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial="hidden"
            animate={testimonialsSection.isInView ? "visible" : "hidden"}
            variants={fadeIn}
            ref={testimonialsSection.ref}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">What Our Users Say</h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from people who have used Peer Capital
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
            variants={staggerContainer}
            initial="hidden"
            animate={testimonialsSection.isInView ? "visible" : "hidden"}
          >
            {[
              {
                quote:
                  "I was able to consolidate my debt at a much lower interest rate than my credit cards were charging. The process was simple and fast.",
                name: "Sarah J.",
                role: "Borrower",
              },
              {
                quote:
                  "As a lender, I've been able to diversify my investment portfolio while helping others achieve their financial goals. The returns have been excellent.",
                name: "Michael T.",
                role: "Lender",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 md:p-8 rounded-xl shadow-sm border"
                variants={fadeIn}
                whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex-grow">
                    <p className="text-sm md:text-base text-gray-600 italic mb-4 md:mb-6">"{testimonial.quote}"</p>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-xs md:text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24 bg-primary text-white overflow-hidden relative">
        <div className="container mx-auto px-4 text-center" ref={ctaSection.ref}>
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={ctaSection.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p
            className="text-base md:text-xl opacity-90 mb-6 md:mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={ctaSection.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join thousands of users who are already getting access to the funds they need.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={ctaSection.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                <Link href="/signup">Create an Account</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                <Link href="/login">Sign In</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        <motion.div
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      </section>

      {/* Footer */}
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
                  <Link href="#" className="hover:text-white">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
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
                  <Link href="#" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
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
                  <Link href="privacy-policy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
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
              </ul>
            </motion.div>
          </div>
          <motion.div
            className="border-t border-gray-800 mt-8 md:mt-12 pt-6 md:pt-8 text-xs md:text-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <p>&copy; {new Date().getFullYear()} Peer Capital. All rights reserved.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
