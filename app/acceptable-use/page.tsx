import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingNav } from "@/components/landing/landing-nav"
import { TopNav } from "@/components/navigation/top-nav"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuthStatus } from "@/lib/actions/auth-check"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AcceptableUsePage() {
  const auth = await checkAuthStatus()
  let userName = "User"
  let userImage = "/vibrant-street-market.png"
  if (auth.authenticated) {
    const userProfile = await getUserProfile()
    userName = `${userProfile?.profile?.first_name || ""} ${userProfile?.profile?.last_name || ""}`.trim() || "User"
    userImage = userProfile?.profile?.profile_picture_url || "/vibrant-street-market.png"
  }

  return (
    <div className="flex flex-col min-h-screen">
      {auth.authenticated ? <TopNav userName={userName} userImage={userImage} /> : <LandingNav />}
      <main className="flex-1">
        <div className="container max-w-3xl mx-auto py-10">
          <h1 className="text-3xl font-bold mb-6">Acceptable Use Policy</h1>
          <p className="text-gray-700 mb-6">
            This Acceptable Use Policy ("Policy") explains the rules and guidelines for using the Peer Capital
            platform and services. By using Peer Capital, you agree to comply with this Policy, our Terms of
            Service, and all applicable laws and regulations.
          </p>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">1. Prohibited Activities</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Engaging in fraud, money laundering, terrorism financing, or any other illegal activity.</li>
              <li>Using false, inaccurate, or misleading information, including identity documents or financial data.</li>
              <li>Harassing, abusing, threatening, or harming other users or third parties.</li>
              <li>Posting or transmitting content that is unlawful, defamatory, obscene, or hateful.</li>
              <li>Attempting to bypass security measures, probe systems, or disrupt service availability.</li>
              <li>Creating multiple accounts to manipulate platform features, ratings, or incentives.</li>
              <li>Using bots, scrapers, or automated tools without written permission.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">2. Lending and Borrowing Conduct</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Only initiate transactions you are authorized and able to complete.</li>
              <li>Do not misrepresent loan purpose, identity, or repayment capacity.</li>
              <li>Respect repayment schedules and honor agreed terms.</li>
              <li>Do not coerce or pressure users into lending or borrowing.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">3. Security & Account Responsibilities</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Keep login credentials secure and do not share your account.</li>
              <li>Notify us promptly of unauthorized access or suspected breaches.</li>
              <li>Comply with verification, KYC, and screening requirements when requested.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">4. Content and Communications</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Do not post content that violates third-party rights or contains harmful code.</li>
              <li>Use respectful language and avoid spam or unsolicited promotions.</li>
              <li>Only share content you have the right to distribute.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">5. Compliance</h2>
            <p className="text-gray-700">
              You must comply with all applicable laws, regulations, and platform rules, including anti-fraud,
              anti-money laundering (AML), counter-terrorist financing (CTF), and data protection obligations.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">6. Enforcement</h2>
            <p className="text-gray-700">
              We may investigate violations of this Policy and take appropriate action, which may include warnings,
              content removal, account suspension or termination, reversal of benefits, reporting to authorities, and
              other lawful remedies.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">7. Reporting</h2>
            <p className="text-gray-700">
              To report violations or concerns, contact support through the app or via our official support channels.
            </p>
          </section>

          <p className="text-gray-600 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
