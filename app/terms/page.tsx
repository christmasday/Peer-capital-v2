import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Peer Capital",
  description: "Terms and conditions for using the Peer Capital platform",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last Updated: May 5, 2023</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to Peer Capital. These Terms of Service ("Terms") govern your access to and use of the Peer
              Capital website, mobile applications, and services (collectively, the "Services"). By accessing or using
              our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access
              or use the Services.
            </p>
            <p className="mt-4">
              Please read these Terms carefully, as they contain important information about your legal rights,
              remedies, and obligations. By using the Services, you are entering into a legal contract with Peer
              Capital.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
            <p>In these Terms, the following definitions apply:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>
                "Peer Capital," "we," "our," or "us" refers to Peer Capital, Inc. and its subsidiaries and affiliates.
              </li>
              <li>"User," "you," or "your" refers to any individual or entity that accesses or uses our Services.</li>
              <li>"Borrower" refers to a User who requests or receives a loan through our Services.</li>
              <li>"Lender" or "Helper" refers to a User who provides funds for loans through our Services.</li>
              <li>
                "Content" refers to text, graphics, images, music, software, audio, video, information, or other
                materials.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
            <p>
              To use our Services, you must be at least 18 years old and able to form legally binding contracts. By
              accessing or using our Services, you represent and warrant that you are at least 18 years old and have the
              legal capacity to enter into these Terms.
            </p>
            <p className="mt-4">
              If you are using the Services on behalf of a business or other entity, you represent and warrant that you
              have the authority to bind that business or entity to these Terms and that you agree to these Terms on
              behalf of that business or entity.
            </p>
            <p className="mt-4">
              Our Services are intended for users who are residents of Nigeria. By using our Services, you represent and
              warrant that you are a resident of Nigeria and that you will comply with all applicable laws and
              regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Account Registration and Security</h2>
            <p>
              To access certain features of our Services, you must register for an account. When you register, you will
              be required to provide certain information, such as your name, email address, phone number, and other
              personal information.
            </p>
            <p className="mt-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities
              that occur under your account. You agree to notify us immediately of any unauthorized use of your account
              or any other breach of security.
            </p>
            <p className="mt-4">
              You agree to provide accurate, current, and complete information during the registration process and to
              update such information to keep it accurate, current, and complete. We reserve the right to suspend or
              terminate your account if any information provided during the registration process or thereafter proves to
              be inaccurate, not current, or incomplete.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Platform Services</h2>
            <p>
              Peer Capital provides a platform that connects Borrowers with Lenders. Our Services include, but are not
              limited to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Facilitating loan requests and funding</li>
              <li>Processing payments and disbursements</li>
              <li>Providing account management tools</li>
              <li>Offering credit assessment and scoring</li>
              <li>Providing customer support</li>
            </ul>
            <p className="mt-4">
              We do not guarantee that Borrowers will receive funding or that Lenders will receive returns on their
              investments. We are not a bank, credit union, or financial institution, and we do not provide loans
              directly. We are a platform that facilitates peer-to-peer lending.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. User Responsibilities</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Borrower Responsibilities</h3>
            <p>As a Borrower, you are responsible for:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Providing accurate and complete information in your loan request</li>
              <li>Using loan funds for the stated purpose</li>
              <li>Repaying loans according to the agreed-upon terms</li>
              <li>Communicating promptly with Peer Capital regarding any issues with repayment</li>
              <li>Maintaining accurate and up-to-date contact and banking information</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Lender Responsibilities</h3>
            <p>As a Lender, you are responsible for:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Conducting your own due diligence on potential loans</li>
              <li>Understanding the risks associated with peer-to-peer lending</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Maintaining accurate and up-to-date contact and banking information</li>
              <li>Paying any applicable taxes on income earned through our Services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Prohibited Activities</h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Violating any applicable law, regulation, or these Terms</li>
              <li>Providing false, inaccurate, or misleading information</li>
              <li>Using the Services for any illegal purpose</li>
              <li>Attempting to circumvent any security measures or features of the Services</li>
              <li>Interfering with the proper operation of the Services</li>
              <li>Engaging in any form of automated data collection without our prior consent</li>
              <li>
                Impersonating any person or entity or falsely stating or otherwise misrepresenting your affiliation with
                a person or entity
              </li>
              <li>Harassing, threatening, or intimidating any other user</li>
              <li>Using the Services to send unsolicited communications</li>
              <li>Attempting to defraud Peer Capital or any user</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Fees and Payments</h2>
            <p>
              Peer Capital charges fees for the use of our Services. These fees may include, but are not limited to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Origination fees for Borrowers</li>
              <li>Service fees for Lenders</li>
              <li>Late payment fees</li>
              <li>Processing fees for certain payment methods</li>
            </ul>
            <p className="mt-4">
              All fees are disclosed before you complete a transaction. By using our Services, you agree to pay all
              applicable fees. We reserve the right to change our fees at any time, with notice to users.
            </p>
            <p className="mt-4">
              Payments made through our Services are processed by third-party payment processors. By using our Services,
              you authorize us to charge or debit your designated payment method for all applicable fees and amounts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
            <p>
              The Services and all content and materials included on or within the Services, including, but not limited
              to, text, graphics, logos, images, and software, are the property of Peer Capital or our licensors and are
              protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-4">
              We grant you a limited, non-exclusive, non-transferable, and revocable license to access and use the
              Services for their intended purposes, subject to your compliance with these Terms. You may not:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>
                Modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative
                works from, transfer, or sell any content or materials from the Services
              </li>
              <li>Use any content or materials for commercial purposes without our prior written consent</li>
              <li>Remove any copyright, trademark, or other proprietary notices from any content or materials</li>
              <li>Use any data mining, robots, or similar data gathering or extraction methods</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p>
              We may terminate or suspend your access to the Services immediately, without prior notice or liability,
              for any reason, including, without limitation, if you breach these Terms.
            </p>
            <p className="mt-4">
              Upon termination, your right to use the Services will immediately cease. If you wish to terminate your
              account, you may simply discontinue using the Services or contact us to request account deletion.
            </p>
            <p className="mt-4">
              All provisions of these Terms which by their nature should survive termination shall survive termination,
              including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of
              liability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Disclaimers and Limitations of Liability</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Disclaimers</h3>
            <p>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-4">
              WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED,
              OR THAT THE SERVICES OR THE SERVERS THAT MAKE THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL
              COMPONENTS.
            </p>
            <p className="mt-4">
              WE MAKE NO REPRESENTATIONS OR WARRANTIES ABOUT THE ACCURACY, RELIABILITY, COMPLETENESS, OR TIMELINESS OF
              THE CONTENT PROVIDED THROUGH THE SERVICES.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PEER CAPITAL, ITS AFFILIATES, OR
              THEIR RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, PUNITIVE,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS
              OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, THAT RESULT FROM THE USE OF, OR INABILITY TO
              USE, THE SERVICES.
            </p>
            <p className="mt-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICES
              EXCEED THE AMOUNT PAID BY YOU, IF ANY, FOR ACCESSING THE SERVICES DURING THE TWELVE (12) MONTHS
              IMMEDIATELY PRECEDING THE DATE OF THE CLAIM.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Peer Capital, its affiliates, and their respective
              officers, directors, employees, and agents from and against any and all claims, liabilities, damages,
              losses, costs, expenses, or fees (including reasonable attorneys' fees) that arise from or relate to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Your use of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another person or entity</li>
              <li>Your violation of any applicable law, rule, or regulation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
            <p>
              Any dispute arising from or relating to these Terms or the Services shall be resolved through binding
              arbitration in accordance with the rules of the Nigerian Arbitration and Conciliation Act. The arbitration
              shall be conducted in Lagos, Nigeria, in the English language, and the decision of the arbitrator shall be
              final and binding.
            </p>
            <p className="mt-4">
              You agree that any arbitration shall be conducted on an individual basis and not as a class, consolidated,
              or representative action. If for any reason a claim proceeds in court rather than in arbitration, you
              waive any right to a jury trial.
            </p>
            <p className="mt-4">
              Notwithstanding the foregoing, you and Peer Capital may seek injunctive or other equitable relief in any
              court of competent jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p>
              These Terms and your use of the Services shall be governed by and construed in accordance with the laws of
              the Federal Republic of Nigeria, without giving effect to any principles of conflicts of law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. If we make changes, we will provide notice by
              posting the updated Terms on our website and updating the "Last Updated" date at the top of these Terms.
            </p>
            <p className="mt-4">
              Your continued use of the Services after the effective date of the revised Terms constitutes your
              acceptance of the changes. If you do not agree to the revised Terms, you must stop using the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Severability</h2>
            <p>
              If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions
              shall continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy and any other agreements expressly incorporated by reference
              herein, constitute the entire agreement between you and Peer Capital concerning the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">18. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
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
