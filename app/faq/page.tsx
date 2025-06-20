import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle, DollarSign, Shield, User, CreditCard, BookOpen } from "lucide-react"

export default function FAQPage() {
  // FAQ categories
  const categories = [
    { id: "getting-started", name: "Getting Started", icon: BookOpen },
    { id: "borrowing", name: "Borrowing", icon: DollarSign },
    { id: "lending", name: "Lending & Helping", icon: HelpCircle },
    { id: "account", name: "Account Management", icon: User },
    { id: "security", name: "Security", icon: Shield },
    { id: "payments", name: "Payments", icon: CreditCard },
  ]

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions about Peer Capital's services, account management, and more.
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Link key={category.id} href={`#${category.id}`} scroll={true}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-3">
                    <Icon className="h-6 w-6 text-blue-700" />
                  </div>
                  <h3 className="font-medium">{category.name}</h3>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Getting Started */}
      <section id="getting-started" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <BookOpen className="mr-2 h-6 w-6 text-blue-700" />
          Getting Started
        </h2>
        <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm border">
          <AccordionItem value="what-is-peer-capital">
            <AccordionTrigger className="px-6">What is Peer Capital?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Peer Capital is a peer-to-peer lending platform that connects borrowers directly with lenders and helpers.
              Our platform allows individuals to borrow money at competitive rates while enabling lenders to earn
              attractive returns on their investments. We eliminate the traditional banking middleman, creating a more
              efficient and beneficial financial ecosystem for everyone involved.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="how-does-it-work">
            <AccordionTrigger className="px-6">How does Peer Capital work?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Peer Capital works in four simple steps: First, borrowers create an account and submit a loan application
              specifying the amount needed and purpose. Second, our platform assesses the application and assigns a risk
              rating. Third, lenders review available loan listings and choose which ones to fund. Finally, once a loan
              is fully funded, the money is transferred to the borrower, who then makes regular repayments according to
              the agreed terms. These repayments, including interest, are distributed to the lenders.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="who-can-use">
            <AccordionTrigger className="px-6">Who can use Peer Capital?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Peer Capital is available to individuals who are at least 18 years old with a valid ID, bank account, and
              mobile phone number. Borrowers need to meet our credit assessment criteria, which evaluates factors like
              income, employment status, and credit history. Lenders need to have funds available to invest and comply
              with our verification process. Our platform is designed to be inclusive while maintaining necessary
              safeguards for all participants.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="create-account">
            <AccordionTrigger className="px-6">How do I create an account?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Creating an account is easy. Click the "Sign Up" button on our homepage, enter your email address and
              create a password. You'll receive a verification email to confirm your account. After verification,
              complete your profile by providing personal information, uploading identification documents, and linking
              your bank account. This process typically takes less than 10 minutes, and once your identity is verified
              (usually within 24 hours), you can start using the platform.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fees">
            <AccordionTrigger className="px-6">What fees does Peer Capital charge?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Peer Capital charges a one-time origination fee to borrowers, typically 1-5% of the loan amount, which is
              deducted from the loan proceeds. For lenders, we charge a service fee of 1% on the payments received.
              There are no hidden fees, and we're completely transparent about all costs. Late payment fees may apply to
              borrowers who miss their scheduled payments, which helps ensure timely repayments to lenders.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Borrowing */}
      <section id="borrowing" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <DollarSign className="mr-2 h-6 w-6 text-blue-700" />
          Borrowing
        </h2>
        <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm border">
          <AccordionItem value="loan-amounts">
            <AccordionTrigger className="px-6">How much can I borrow?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Loan amounts on Peer Capital range from ₦10,000 to ₦500,000 for first-time borrowers. As you build a
              positive repayment history on our platform, your borrowing limit can increase up to ₦2,000,000. The
              specific amount you qualify for depends on factors such as your income, credit score, employment status,
              and existing debt obligations. Our system will provide you with your personalized borrowing limit after
              completing the application process.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="interest-rates">
            <AccordionTrigger className="px-6">What are the interest rates?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Interest rates on Peer Capital typically range from 8% to 25% APR, depending on your credit profile and
              loan term. These rates are often lower than traditional bank loans or credit cards. Your specific rate is
              determined by our risk assessment algorithm, which evaluates your creditworthiness based on various
              factors. The interest rate is fixed for the duration of your loan, so your monthly payments will remain
              consistent throughout the repayment period.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="loan-terms">
            <AccordionTrigger className="px-6">What are the loan terms?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Peer Capital offers loan terms ranging from 3 to 24 months. The available terms depend on the loan amount
              and purpose. Shorter terms typically have higher monthly payments but lower total interest costs, while
              longer terms offer more affordable monthly payments but higher overall interest. You can choose the term
              that best fits your financial situation during the application process, and our calculator will show you
              the exact monthly payment amount before you commit.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="application-process">
            <AccordionTrigger className="px-6">What is the loan application process?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              The loan application process is straightforward: First, create an account and complete your profile. Then,
              submit a loan application specifying the amount, purpose, and preferred term. You'll need to provide
              information about your income, employment, and expenses, and upload supporting documents like pay stubs or
              bank statements. Our system will assess your application and provide an instant decision in most cases.
              Once approved, your loan listing will be visible to lenders, and funding typically occurs within 1-3 days.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="approval-time">
            <AccordionTrigger className="px-6">How long does approval take?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Most loan applications receive an initial approval decision within minutes of submission. However,
              complete approval depends on verification of your information and documents, which typically takes 1-2
              business days. Once approved, your loan is listed on our marketplace, where it needs to be funded by
              lenders. The funding process usually takes 1-3 days, depending on the loan amount and current marketplace
              activity. Overall, most borrowers receive their funds within 2-5 days of applying.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Lending & Helping */}
      <section id="lending" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <HelpCircle className="mr-2 h-6 w-6 text-blue-700" />
          Lending & Helping
        </h2>
        <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm border">
          <AccordionItem value="how-to-lend">
            <AccordionTrigger className="px-6">How do I start lending?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              To start lending, create an account, complete your profile, and verify your identity. Fund your Peer
              Capital wallet through a bank transfer or other supported payment methods. Once your wallet is funded,
              browse available loan listings and select those that match your investment criteria. You can invest as
              little as ₦5,000 per loan, allowing you to diversify across multiple borrowers. After selecting a loan,
              confirm your investment, and the funds will be allocated from your wallet to that loan.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="returns">
            <AccordionTrigger className="px-6">What returns can I expect as a lender?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Lenders on Peer Capital typically earn annual returns ranging from 8% to 20%, depending on the risk grade
              of the loans they fund. Higher-risk loans offer higher potential returns but come with increased default
              risk. The average return across all loan grades is approximately 12-15% annually. Returns are paid monthly
              as borrowers make their repayments, which include both principal and interest. These returns are often
              significantly higher than traditional savings accounts or fixed deposits.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="lending-risks">
            <AccordionTrigger className="px-6">What are the risks of lending?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              The primary risk of lending is borrower default, where a borrower fails to repay their loan. While Peer
              Capital conducts thorough credit assessments, defaults can still occur due to unforeseen circumstances
              like job loss or medical emergencies. To mitigate this risk, we recommend diversifying your investments
              across multiple loans and risk grades. Additionally, we have a recovery process for delinquent loans,
              though recovery is not guaranteed. It's important to only invest funds you can afford to lose and to
              understand that peer-to-peer lending investments are not insured by government deposit insurance.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="helper-role">
            <AccordionTrigger className="px-6">What is a Helper on Peer Capital?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              A Helper on Peer Capital is someone who assists borrowers in getting their loans funded by vouching for
              them. Helpers can be friends, family members, or trusted connections who believe in the borrower's ability
              to repay. By becoming a Helper, you're not providing funds directly, but you're improving the borrower's
              credibility on the platform. Helpers receive notifications about the borrower's repayment status and may
              be contacted if the borrower falls behind on payments. This system leverages social connections to enhance
              trust in the lending ecosystem.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="auto-invest">
            <AccordionTrigger className="px-6">Does Peer Capital offer auto-invest features?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Yes, Peer Capital offers an Auto-Invest feature that automatically invests your funds based on criteria
              you set. You can specify loan grades, term lengths, interest rate ranges, and maximum investment per loan.
              Once configured, the system will automatically invest in matching loans as they become available, saving
              you time and ensuring you don't miss investment opportunities. You can pause, modify, or cancel your
              Auto-Invest settings at any time, and you'll receive notifications for all automatic investments made on
              your behalf.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Account Management */}
      <section id="account" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <User className="mr-2 h-6 w-6 text-blue-700" />
          Account Management
        </h2>
        <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm border">
          <AccordionItem value="update-profile">
            <AccordionTrigger className="px-6">How do I update my profile information?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              To update your profile information, log in to your account and navigate to the "Profile" section. Click on
              "Edit Profile" to modify your personal details, contact information, or employment data. For security
              reasons, some changes (like your name or date of birth) may require additional verification. If you need
              to update your bank account information, go to the "Bank Accounts" section under your profile. Most
              changes take effect immediately, though some updates may require review by our team.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="change-password">
            <AccordionTrigger className="px-6">How do I change my password?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              To change your password, log in to your account and go to the "Profile" section. Click on "Security" or
              "Change Password." You'll need to enter your current password for verification, then create and confirm
              your new password. For security, choose a strong password that includes a mix of letters, numbers, and
              special characters. After changing your password, you'll receive an email confirmation, and you'll need to
              use the new password for all future logins. If you've forgotten your current password, use the "Forgot
              Password" option on the login page instead.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="account-statements">
            <AccordionTrigger className="px-6">How do I access my account statements?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Account statements are available in the "Transactions" or "Reports" section of your dashboard. You can
              view monthly statements showing all account activity, including deposits, withdrawals, loan repayments,
              and interest earned or paid. Statements can be filtered by date range and transaction type, and can be
              downloaded as PDF or CSV files for your records. We maintain statement history for up to 24 months on the
              platform. For older statements, you may need to contact our support team.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="close-account">
            <AccordionTrigger className="px-6">How do I close my account?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              To close your account, first ensure that you have no active loans (as a borrower) or investments (as a
              lender). Withdraw any remaining balance from your wallet to your bank account. Then go to "Profile
              Settings" and select "Close Account." You'll need to confirm your decision and may be asked to complete a
              brief survey about your experience. Account closure is processed within 5 business days. Note that account
              data is retained for regulatory purposes, but your personal information will be anonymized according to
              our privacy policy.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notifications">
            <AccordionTrigger className="px-6">How do I manage my notification settings?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              To manage your notifications, go to "Profile" and select "Notification Preferences." Here, you can
              customize which notifications you receive and how you receive them (email, SMS, or in-app). You can set
              preferences for loan updates, payment reminders, new investment opportunities, account security alerts,
              and marketing communications. While some critical notifications (like payment confirmations and security
              alerts) cannot be disabled for security reasons, most other notifications can be customized according to
              your preferences.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Security */}
      <section id="security" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Shield className="mr-2 h-6 w-6 text-blue-700" />
          Security
        </h2>
        <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm border">
          <AccordionItem value="data-protection">
            <AccordionTrigger className="px-6">How does Peer Capital protect my data?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Peer Capital employs bank-level security measures to protect your data. All personal and financial
              information is encrypted using 256-bit SSL encryption during transmission and at rest. We maintain strict
              access controls, with data access limited to authorized personnel on a need-to-know basis. Our systems are
              regularly audited and tested for vulnerabilities, and we comply with international data protection
              standards. We never sell your personal data to third parties and only share information as outlined in our
              privacy policy.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="identity-verification">
            <AccordionTrigger className="px-6">How does identity verification work?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Our identity verification process uses a combination of document verification and biometric checks. You'll
              need to upload a government-issued ID (such as a national ID card, driver's license, or passport) and a
              recent utility bill or bank statement for address verification. You'll also complete a quick selfie check
              that uses facial recognition to match your face to your ID. This multi-factor approach helps prevent fraud
              and ensures regulatory compliance. The verification process typically takes less than 24 hours to
              complete.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="account-security">
            <AccordionTrigger className="px-6">How can I keep my account secure?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              To maximize your account security, use a strong, unique password and enable two-factor authentication
              (2FA) in your security settings. Never share your login credentials or verification codes with anyone,
              including Peer Capital staff. Be vigilant about phishing attempts—we will never ask for your password via
              email or phone. Log out when using shared computers, and regularly check your account for any unauthorized
              activities. Update your contact information promptly so you can receive security alerts, and install
              security updates on your devices regularly.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="suspicious-activity">
            <AccordionTrigger className="px-6">What should I do if I notice suspicious activity?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              If you notice any suspicious activity on your account, immediately change your password and contact our
              security team at security@peercapital.com or through our emergency helpline at +234 800 000 0000.
              Suspicious activities might include unrecognized transactions, login attempts from unknown locations, or
              emails about account changes you didn't make. Our security team will investigate the issue, secure your
              account, and guide you through any necessary steps. We recommend enabling login notifications so you're
              immediately alerted to any access attempts.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="privacy-policy">
            <AccordionTrigger className="px-6">Where can I find your privacy policy?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Our privacy policy is available at the bottom of our website under "Legal" or directly at
              peercapital.com/privacy-policy. The policy details what personal information we collect, how we use it,
              who we share it with, and your rights regarding your data. We update our privacy policy periodically to
              reflect regulatory changes or service improvements, and we notify users of significant changes. If you
              have specific questions about our privacy practices, you can contact our data protection officer at
              privacy@peercapital.com.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Payments */}
      <section id="payments" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <CreditCard className="mr-2 h-6 w-6 text-blue-700" />
          Payments
        </h2>
        <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm border">
          <AccordionItem value="payment-methods">
            <AccordionTrigger className="px-6">What payment methods are accepted?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Peer Capital accepts various payment methods including bank transfers, debit cards, and mobile money services like Paystack. For bank transfers, we provide unique account details for each user to ensure proper crediting. Debit card payments are processed instantly, while bank transfers typically reflect in your account within 1-2 business days. All payment methods are secured with industry-standard encryption and authentication protocols to protect your financial information.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="transfer-fees">
            <AccordionTrigger className="px-6">What are the transfer fees on Peer Capital?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Our transfer fees are simple and transparent:
              <ul className="list-disc ml-6 mt-2">
                <li>Transfers of NGN 5,000 and below: <b>NGN 10 per transfer</b></li>
                <li>Transfers between NGN 5,001 and NGN 50,000: <b>NGN 25 per transfer</b></li>
                <li>Transfers above NGN 50,000: <b>NGN 50 per transfer</b></li>
              </ul>
              These fees apply to both withdrawals and peer-to-peer transfers. There are no hidden charges.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="multiple-bank-accounts">
            <AccordionTrigger className="px-6">Can I add multiple bank accounts?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Yes! You can add and manage multiple bank accounts in your profile. Go to the "Bank Account Details" section and use the "Add Account" button to save additional accounts. You can also remove accounts you no longer use. This makes it easy to choose where to receive withdrawals or make transfers.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contact-support">
            <AccordionTrigger className="px-6">How do I contact Peer Capital support?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              You can reach our support team by emailing <a href="mailto:peercapital911@gmail.com" className="text-blue-600 underline">peercapital911@gmail.com</a>. We aim to respond to all inquiries within 24 hours. For urgent issues, use the contact form on our website or call our helpline. Our team is here to help with any questions or concerns.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="loan-repayments">
            <AccordionTrigger className="px-6">How do loan repayments work?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Loan repayments are made according to the schedule established when your loan was approved, typically
              monthly. You can set up automatic repayments from your linked bank account or debit card for convenience,
              or manually make payments before each due date. Repayments include both principal and interest components.
              You'll receive payment reminders via email and SMS a few days before each due date. If you anticipate
              difficulty making a payment, contact us in advance to discuss potential solutions like payment extensions.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="early-repayment">
            <AccordionTrigger className="px-6">Can I repay my loan early?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              Yes, you can repay your loan early, either partially or in full, at any time without any prepayment
              penalties. Early repayments reduce the total interest you pay over the life of the loan. To make an early
              repayment, log in to your account, navigate to "My Loans," select the loan you want to repay, and choose
              the "Make Payment" or "Pay Off Loan" option. The system will calculate the remaining balance, including
              any accrued interest up to the payment date. After processing your payment, you'll receive a confirmation
              and an updated loan statement.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="withdrawal-process">
            <AccordionTrigger className="px-6">How do I withdraw funds from my account?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              To withdraw funds from your Peer Capital account, go to the "Wallet" section of your dashboard and select
              "Withdraw." Enter the amount you wish to withdraw and select your preferred bank account from your saved
              accounts. If you haven't added a bank account yet, you'll need to do so first. Withdrawal requests are
              processed within 1-2 business days, and funds typically appear in your bank account within 1-3 business
              days after processing, depending on your bank. There's a minimum withdrawal amount of ₦1,000, and a small
              transaction fee may apply.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payment-issues">
            <AccordionTrigger className="px-6">What if I have issues with a payment?</AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              If you encounter any payment issues, such as a failed transaction, double payment, or unrecognized charge,
              contact our support team immediately through the "Help" section in your account or by emailing
              support@peercapital.com. Provide details of the transaction, including date, amount, and any error
              messages you received. For faster resolution, include screenshots if available. Our payment support team
              will investigate the issue and respond within 24 hours. In most cases, payment issues are resolved within
              2-5 business days, depending on the complexity and whether third-party banks are involved.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Contact Support */}
      <div className="bg-blue-50 p-8 rounded-lg text-center">
        <h3 className="text-xl font-semibold mb-3">Still have questions?</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Our support team is ready to assist you with any questions or concerns you may have about Peer Capital's
          services.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  )
}
