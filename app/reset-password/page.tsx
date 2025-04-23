import { ResetPasswordForm } from "@/components/reset-password-form"
import { Logo } from "@/components/logo"
import { Suspense } from "react"

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-blue-900" />
      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <Logo width={180} height={60} />
        </div>
        <h1 className="text-3xl font-bold text-center mb-6 text-white">Reset Your Password</h1>
        <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  )
}
