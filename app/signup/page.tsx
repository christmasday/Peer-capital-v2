import { SignupForm } from "@/components/signup-form"
import { Logo } from "@/components/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      {/* Left side - Signup Form */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-6 md:p-10 bg-white">
      <div className="w-full max-w-md">
          <div className="flex justify-center md:justify-start mb-8">
            <Logo width={180} height={60} />
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center md:text-left">Create your account</CardTitle>
              <CardDescription className="text-center md:text-left">
                Enter your information to create your account
              </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Right side - Background Image with Overlay */}
      <div className="hidden md:block w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-gray-900/90 z-10"></div>
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('/vibrant-street-market.png')" }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-white text-center px-6">
            <h2 className="text-3xl font-bold mb-4">Welcome to Peer Capital</h2>
            <p className="text-xl opacity-80">Your trusted platform for peer-to-peer lending</p>
          </div>
        </div>
      </div>
    </main>
  )
}
