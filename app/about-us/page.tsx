import React from "react"
import { LandingNav } from "@/components/landing/landing-nav"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function AboutUsPage() {
  return (
    <>
      <LandingNav />
      <div className="container max-w-3xl mx-auto py-16 px-4">
        <section className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-blue-700">About Peer Capital</h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Peer Capital is a modern peer-to-peer lending platform dedicated to empowering individuals and small businesses across Africa. We connect borrowers and lenders in a secure, transparent, and user-friendly environment, making access to credit and investment opportunities easier than ever.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">Our Mission</h2>
          <p className="text-gray-700">
            To democratize access to financial services by bridging the gap between those who need capital and those who can provide it, fostering financial inclusion and economic growth.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">Our Vision</h2>
          <p className="text-gray-700">
            To become Africa's most trusted and innovative peer-to-peer lending platform, enabling millions to achieve their financial goals and build a better future.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">Our Values</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><span className="font-medium text-blue-700">Transparency:</span> We believe in open, honest communication and clear processes for all users.</li>
            <li><span className="font-medium text-blue-700">Security:</span> Protecting your data and funds is our top priority.</li>
            <li><span className="font-medium text-blue-700">Empowerment:</span> We strive to give everyone the tools and opportunities to succeed financially.</li>
            <li><span className="font-medium text-blue-700">Innovation:</span> We continuously improve our platform to deliver the best experience possible.</li>
            <li><span className="font-medium text-blue-700">Community:</span> We foster a supportive network of borrowers and lenders who help each other grow.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">What We Do</h2>
          <p className="text-gray-700">
            Peer Capital connects people who need loans with those willing to lend, offering fair rates, flexible terms, and a seamless digital experience. Our platform leverages technology to assess creditworthiness, manage risk, and ensure a smooth process for all participants.
          </p>
        </section>

        <section className="text-center mt-16">
          <h3 className="text-xl font-semibold mb-2 text-blue-700">Join Us on Our Mission</h3>
          <p className="text-gray-700 mb-4">
            Whether you're looking to borrow, lend, or simply learn more, Peer Capital is here to help you achieve your financial goals.
          </p>
          <a href="/signup" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Get Started</a>
        </section>
      </div>
      <LandingFooter />
    </>
  )
} 