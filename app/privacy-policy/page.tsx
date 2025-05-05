import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | PeerCapital",
  description: "Learn how PeerCapital collects, uses, and protects your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-lg mb-6">Last Updated: May 5, 2025</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Welcome to PeerCapital. We respect your privacy and are committed to protecting your personal data. This
          privacy policy will inform you about how we look after your personal data when you visit our website and tell
          you about your privacy rights and how the law protects you.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        <p>We collect several types of information from and about users of our platform, including:</p>
        <ul className="list-disc pl-6 mb-6">
          <li>Personal identifiers (name, email address, phone number)</li>
          <li>Financial information (bank account details, transaction history)</li>
          <li>Identity verification information (government ID, employment details)</li>
          <li>Profile information (profile picture, biography)</li>
          <li>Communication data (messages between users)</li>
          <li>Technical data (IP address, browser type, device information)</li>
          <li>Usage data (how you interact with our platform)</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p>We use your information for the following purposes:</p>
        <ul className="list-disc pl-6 mb-6">
          <li>To create and manage your account</li>
          <li>To facilitate peer-to-peer lending transactions</li>
          <li>To verify your identity and prevent fraud</li>
          <li>To process payments and transfers</li>
          <li>To enable communication between users</li>
          <li>To provide customer support</li>
          <li>To improve our platform and services</li>
          <li>To send you notifications and updates</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Sharing and Disclosure</h2>
        <p>We may share your information with:</p>
        <ul className="list-disc pl-6 mb-6">
          <li>Other users (as necessary for lending transactions)</li>
          <li>Payment processors and financial institutions</li>
          <li>Identity verification services</li>
          <li>Service providers who help us operate our platform</li>
          <li>Legal authorities when required by law</li>
          <li>Business partners (only with your consent)</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Rights</h2>
        <p>Depending on your location, you may have the following rights regarding your data:</p>
        <ul className="list-disc pl-6 mb-6">
          <li>Right to access your personal data</li>
          <li>Right to correct inaccurate data</li>
          <li>Right to delete your data</li>
          <li>Right to restrict processing</li>
          <li>Right to data portability</li>
          <li>Right to object to processing</li>
          <li>Right to withdraw consent</li>
        </ul>
        <p>To exercise these rights, please contact us using the details provided in the "Contact Us" section.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Security</h2>
        <p>
          We have implemented appropriate security measures to prevent your personal data from being accidentally lost,
          used, or accessed in an unauthorized way. We limit access to your personal data to employees, agents,
          contractors, and other third parties who have a business need to know. They will only process your personal
          data on our instructions, and they are subject to a duty of confidentiality.
        </p>
        <p>
          We have procedures to deal with any suspected personal data breach and will notify you and any applicable
          regulator of a breach where we are legally required to do so.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our platform and hold certain
          information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
          You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        </p>
        <p>We use the following types of cookies:</p>
        <ul className="list-disc pl-6 mb-6">
          <li>Essential cookies: Required for the operation of our platform</li>
          <li>
            Analytical cookies: Allow us to recognize and count visitors and see how they move around our platform
          </li>
          <li>Functionality cookies: Enable us to personalize your experience</li>
          <li>
            Targeting cookies: Record your visit to our platform, the pages you have visited, and the links you have
            followed
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
        <p>
          Our platform is not intended for children under 18 years of age. We do not knowingly collect personal
          information from children under 18. If you are a parent or guardian and you are aware that your child has
          provided us with personal information, please contact us so that we can take necessary actions.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
        <p>
          We may update our privacy policy from time to time. We will notify you of any changes by posting the new
          privacy policy on this page and updating the "Last Updated" date. You are advised to review this privacy
          policy periodically for any changes.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
        <p className="mb-6">
          Email: privacy@peercapital.com
          <br />
          Address: 123 Finance Street, Lagos, Nigeria
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Legal Basis for Processing (for EU/EEA users)</h2>
        <p>
          If you are located in the EU or EEA, we collect and process your personal data on the following legal bases:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Performance of a contract when we provide you with our services</li>
          <li>Legitimate interests for processing that is necessary for our business operations</li>
          <li>Compliance with legal obligations</li>
          <li>Your consent, where applicable</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than the country in which you are
          resident. These countries may have data protection laws that are different from the laws of your country. We
          have taken appropriate safeguards to require that your personal information will remain protected in
          accordance with this privacy policy.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Data Retention</h2>
        <p>
          We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for,
          including for the purposes of satisfying any legal, accounting, or reporting requirements. To determine the
          appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the
          personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, the
          purposes for which we process your personal data, and the applicable legal requirements.
        </p>
      </div>
    </div>
  )
}
