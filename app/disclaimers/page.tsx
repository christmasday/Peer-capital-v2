import type { Metadata } from "next"
import { AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Financial Disclaimers | Peer Capital",
  description: "Important financial disclaimers and risk disclosures for Peer Capital users",
}

export default function DisclaimersPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
          <h1 className="text-3xl md:text-4xl font-bold">Financial Disclaimers</h1>
        </div>
        <p className="text-gray-600 mb-8">Last Updated: May 5, 2023</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. General Disclaimer</h2>
            <p>
              The information provided on Peer Capital's platform is for general informational purposes only. All
              information on the platform is provided in good faith, however, we make no representation or warranty of
              any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or
              completeness of any information on the platform.
            </p>
            <p className="mt-4">
              Peer Capital is not a bank, credit union, or licensed financial institution. We are a platform that
              facilitates peer-to-peer lending between users. We do not provide loans directly, nor do we guarantee the
              performance of any loans facilitated through our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Not Financial Advice</h2>
            <p>
              The content on Peer Capital's platform is not intended to be financial advice. It is not intended to
              constitute financial advice or a recommendation to buy, sell, or hold any financial product or engage in
              any financial transaction.
            </p>
            <p className="mt-4">
              Before making any financial decisions, including decisions to lend or borrow through our platform, you
              should conduct your own research and consult with a qualified financial advisor. You should also consider
              your investment objectives, risk tolerance, and financial situation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Investment Risks</h2>
            <p>Investing in peer-to-peer loans involves significant risks, including but not limited to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>
                <strong>Credit Risk:</strong> Borrowers may default on their loans, resulting in a loss of principal
                and/or interest.
              </li>
              <li>
                <strong>Liquidity Risk:</strong> Investments in peer-to-peer loans are generally illiquid. There is no
                guarantee that you will be able to sell or transfer your investment before the loan term ends.
              </li>
              <li>
                <strong>Platform Risk:</strong> Peer Capital's platform may experience technical issues, security
                breaches, or other operational problems that could affect your ability to access your account or your
                investments.
              </li>
              <li>
                <strong>Regulatory Risk:</strong> Changes in laws or regulations may adversely affect the operation of
                Peer Capital's platform or the value of your investments.
              </li>
              <li>
                <strong>Market Risk:</strong> Economic conditions, interest rates, and other market factors may affect
                the performance of your investments.
              </li>
              <li>
                <strong>Concentration Risk:</strong> If you invest a large portion of your portfolio in peer-to-peer
                loans or in loans to a small number of borrowers, your investment portfolio may lack diversification,
                which could increase your risk of loss.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Past Performance</h2>
            <p>
              Past performance is not a reliable indicator of future results. Any historical returns, expected returns,
              or probability projections may not reflect actual future performance. All investments involve risk,
              including the possible loss of principal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. No Guarantee of Returns</h2>
            <p>
              Peer Capital does not guarantee any rate of return on investments made through our platform. The interest
              rates displayed on our platform are not guaranteed and may not reflect the actual returns you will
              receive.
            </p>
            <p className="mt-4">
              The actual return on your investment will depend on various factors, including but not limited to the
              performance of the loans you invest in, the occurrence of defaults, and the fees charged by Peer Capital.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Borrower Disclaimer</h2>
            <p>
              If you are a borrower, you should carefully consider whether taking out a loan through Peer Capital's
              platform is appropriate for your financial situation. You should consider the interest rate, fees, loan
              term, and repayment schedule before accepting a loan offer.
            </p>
            <p className="mt-4">
              Failure to repay a loan may result in negative consequences, including but not limited to damage to your
              credit score, collection activities, and legal action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Tax Implications</h2>
            <p>
              Peer Capital does not provide tax advice. The tax treatment of investments made through our platform may
              vary depending on your individual circumstances and the tax laws in your jurisdiction.
            </p>
            <p className="mt-4">
              You should consult with a qualified tax professional to understand the tax implications of investing or
              borrowing through our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Regulatory Compliance</h2>
            <p>
              Peer Capital strives to comply with all applicable laws and regulations. However, the regulatory
              environment for peer-to-peer lending is evolving, and there may be changes in laws or regulations that
              affect our platform or your investments.
            </p>
            <p className="mt-4">
              Peer Capital is not regulated as a bank, securities broker-dealer, or investment advisor. The protections
              associated with these regulated entities may not be available to users of our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Jurisdiction Limitations</h2>
            <p>
              Peer Capital's services are intended for users who are residents of Nigeria. If you access our platform
              from outside Nigeria, you do so at your own risk and are responsible for compliance with local laws.
            </p>
            <p className="mt-4">
              The information provided on our platform is not intended for distribution to or use by any person or
              entity in any jurisdiction where such distribution or use would be contrary to law or regulation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Third-Party Links</h2>
            <p>
              Peer Capital's platform may contain links to third-party websites or services. We are not responsible for
              the content or practices of these third-party sites and do not endorse or make any representations about
              them.
            </p>
            <p className="mt-4">
              Your use of any third-party websites or services is at your own risk and subject to the terms and
              conditions of those websites or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Disclaimers</h2>
            <p>
              Peer Capital reserves the right to modify these disclaimers at any time. If we make changes, we will
              provide notice by posting the updated disclaimers on our platform and updating the "Last Updated" date at
              the top of this page.
            </p>
            <p className="mt-4">
              Your continued use of our platform after the effective date of the revised disclaimers constitutes your
              acceptance of the changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
            <p>If you have any questions about these disclaimers, please contact us at:</p>
            <p className="mt-4">
              Peer Capital, Inc.
              <br />
              123 Finance Street
              <br />
              Lagos, Nigeria
              <br />
              Email: legal@peercapital.com
              <br />
              Phone: +234 123 456 7890
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
