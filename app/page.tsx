import { LoginForm } from "@/components/login-form"
import { Logo } from "@/components/logo"
import Image from "next/image"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      {/* Left side - Login */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 md:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <Logo width={270} height={90} />
          </div>

          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">Sign in to access your account</p>

          <LoginForm />
        </div>
      </div>

      {/* Right side - Banner */}
      <div className="hidden md:flex md:w-1/2 relative">
        {/* Background image */}
        <Image src="/vibrant-street-market.png" alt="Peer Capital Community" fill className="object-cover" priority />

        {/* Darker overlay for better text readability */}
        <div className="absolute inset-0 bg-black opacity-70" />

        {/* Gradient overlay on top for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-900 opacity-40" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-8 lg:px-12 z-10">
          <div className="max-w-md text-white">
            <h2 className="text-3xl font-bold mb-4 drop-shadow-md">
              Empowering Communities Through Peer-to-Peer Lending
            </h2>
            <p className="text-lg opacity-95 drop-shadow-md">
              Join thousands of people who are building financial resilience together through our community-based
              lending platform.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
