
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingNav } from "@/components/landing/landing-nav"
import { TopNav } from "@/components/navigation/top-nav"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuthStatus } from "@/lib/actions/auth-check"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function RiskDisclosurePage() {
  const auth = await checkAuthStatus()
  let userName = "User"
  let userImage = "/vibrant-street-market.png"
  if (auth.authenticated) {
    const userProfile = await getUserProfile()
    userName = userProfile?.profile?.username ? `@${userProfile.profile.username}` : `${userProfile?.profile?.first_name || ""} ${userProfile?.profile?.last_name || ""}`.trim() || "User"
    userImage = userProfile?.profile?.profile_picture_url || "/vibrant-street-market.png"
  }

  return (
    <div className="flex flex-col min-h-screen">
      {auth.authenticated ? <TopNav userName={userName} userImage={userImage} /> : <LandingNav />}
      <main className="flex-1">
        <div className="container max-w-3xl mx-auto py-10">
          <h1 className="text-3xl font-bold mb-6">Risk Disclosure Statement</h1>
          <p className="text-gray-700 mb-6">
            This Risk Disclosure Statement ("Statement") outlines the significant risks associated with using
            Peer Capital's peer-to-peer lending platform. By using our services, you acknowledge that you have
            read, understood, and accepted these risks.
          </p>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">1. General Risk Warning</h2>
            <p className="text-gray-700">
              Peer-to-peer lending involves significant risks, including the potential loss of your principal
              investment. You should carefully consider whether peer-to-peer lending is suitable for your
              financial situation and investment objectives.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">2. Credit Risk</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Borrowers may default on their loan obligations, resulting in loss of principal and interest.</li>
              <li>Credit assessments and risk ratings are estimates and may not accurately predict default probability.</li>
              <li>Economic downturns or personal circumstances may increase default rates across the platform.</li>
              <li>Recovery of funds from defaulted loans may be limited or delayed.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">3. Platform and Operational Risks</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Technical failures, cyber attacks, or system outages may temporarily prevent access to funds.</li>
              <li>Platform insolvency or regulatory action could result in loss of access to your account.</li>
              <li>Changes to platform terms, fees, or features may affect your investment returns.</li>
              <li>Third-party service providers may experience failures affecting platform operations.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">4. Liquidity Risk</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Peer-to-peer loans are illiquid investments with fixed terms.</li>
              <li>Early withdrawal may not be available or may result in penalties.</li>
              <li>Secondary market liquidity, if available, may be limited and subject to significant discounts.</li>
              <li>Market conditions may affect the ability to sell or transfer loan interests.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">5. Regulatory and Legal Risks</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Changes in laws or regulations may affect platform operations or investment returns.</li>
              <li>Regulatory investigations or enforcement actions could impact platform viability.</li>
              <li>Tax treatment of peer-to-peer lending income may change.</li>
              <li>Legal disputes between borrowers and lenders may affect recovery prospects.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">6. Interest Rate and Market Risks</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Interest rates on loans are fixed and may become unfavorable compared to market rates.</li>
              <li>Inflation may erode the real value of your investment returns.</li>
              <li>Economic conditions may affect borrower ability to repay and platform performance.</li>
              <li>Currency fluctuations may impact returns for international transactions.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">7. Diversification and Concentration Risks</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Investing in a small number of loans increases concentration risk.</li>
              <li>Geographic or sector concentration may amplify losses during economic downturns.</li>
              <li>Platform-specific risks may affect all your investments simultaneously.</li>
              <li>Diversification across multiple platforms may not eliminate all risks.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">8. Information and Transparency Risks</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Borrower information may be incomplete, inaccurate, or outdated.</li>
              <li>Platform reporting and analytics may not capture all relevant risk factors.</li>
              <li>Historical performance data may not be indicative of future results.</li>
              <li>Complex loan structures may be difficult to understand and evaluate.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">9. Fraud and Misrepresentation Risks</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Borrowers may provide false information or documentation.</li>
              <li>Identity theft or account takeover may result in unauthorized transactions.</li>
              <li>Platform security measures may not prevent all fraudulent activities.</li>
              <li>Recovery from fraud-related losses may be limited or impossible.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">10. Tax and Accounting Considerations</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Interest income is generally taxable and must be reported to tax authorities.</li>
              <li>Losses from defaults may have limited tax deductibility.</li>
              <li>Complex tax rules may apply to peer-to-peer lending income.</li>
              <li>Professional tax advice may be required to ensure compliance.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">11. Investment Suitability</h2>
            <p className="text-gray-700">
              Peer-to-peer lending may not be suitable for all investors. Consider your investment objectives,
              risk tolerance, financial situation, and investment experience before investing. You should not
              invest more than you can afford to lose.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">12. No Guarantee of Returns</h2>
            <p className="text-gray-700">
              Past performance does not guarantee future results. There is no assurance that you will achieve
              your investment objectives or that your investment will not lose value. Peer Capital does not
              guarantee any specific rate of return or the safety of your principal investment.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">13. Professional Advice</h2>
            <p className="text-gray-700">
              Consider consulting with a qualified financial advisor, tax professional, or legal counsel before
              making investment decisions. Peer Capital does not provide investment, tax, or legal advice.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">14. Acknowledgment</h2>
            <p className="text-gray-700">
              By using Peer Capital's services, you acknowledge that you have read and understood this Risk
              Disclosure Statement and accept the risks associated with peer-to-peer lending. You agree to
              make investment decisions based on your own assessment of these risks.
            </p>
          </section>

          <p className="text-gray-600 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}