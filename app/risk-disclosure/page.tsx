import React from "react";
import { TopNav } from "@/components/navigation/top-nav";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function RiskDisclosurePage() {
  return (
    <>
      <TopNav />
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Risk Disclosure</h1>
        <div className="space-y-6 text-gray-800">
          <p>
            <strong>Peer Capital</strong> is a platform that connects individuals seeking loans with those willing to lend. By using this platform, you acknowledge and accept the risks associated with peer-to-peer lending and investing.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">Investment Risk</h2>
          <p>
            All investments carry risk. There is no guarantee that you will earn a return on your investment, and you may lose some or all of your invested capital. Past performance is not indicative of future results. You should only invest funds you can afford to lose.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">No Guarantee of Returns</h2>
          <p>
            Peer Capital does not guarantee repayment of loans, interest, or any returns. Borrowers may default on their obligations, and lenders may not recover their principal or expected interest. All lending decisions are made at your own risk and discretion.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">Not Financial Advice</h2>
          <p>
            The information provided on this platform is for informational purposes only and does not constitute financial, investment, or legal advice. You are solely responsible for conducting your own due diligence and seeking independent advice before making any financial decisions.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">User Responsibility</h2>
          <p>
            By participating on Peer Capital, you acknowledge that you understand the risks involved and accept full responsibility for your investment and lending decisions. Peer Capital is not liable for any losses or damages arising from your use of the platform.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">Platform Limitations</h2>
          <p>
            Peer Capital does not provide any guarantees, warranties, or assurances regarding the creditworthiness of borrowers or the likelihood of loan repayment. All users are encouraged to review borrower profiles and make informed decisions.
          </p>
          <p className="mt-8 text-sm text-gray-500">
            If you have any questions about this risk disclosure, please contact us at support@peercapital.com.
          </p>
        </div>
      </div>
      <LandingFooter />
    </>
  );
} 