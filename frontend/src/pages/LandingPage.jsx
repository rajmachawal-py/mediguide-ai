/**
 * MediGuide AI — Landing Page
 * Based on the Stitch "Landing Page" screen design.
 * Clinical Intelligence design system — light, editorial healthcare aesthetic.
 *
 * Sections: Hero → About → Services → FAQ → Footer
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiMessageSquare, FiMapPin, FiNavigation, FiUsers,
  FiShield, FiClock, FiGlobe, FiChevronDown,
  FiArrowRight, FiHeart, FiActivity, FiStar,
} from 'react-icons/fi'

// ── FAQ Data ──────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Is MediGuide AI a replacement for a doctor?',
    a: 'No. MediGuide AI is an AI-powered symptom assessment and triage tool. It does not diagnose, prescribe, or replace any licensed medical professional. Always consult a qualified doctor for medical advice.',
  },
  {
    q: 'How does the symptom triage system work?',
    a: 'Our AI analyzes your described symptoms using a medically-informed model to classify urgency (Mild, Moderate, Urgent, Emergency). It then provides general guidance and suggests appropriate next steps, such as visiting a nearby hospital.',
  },
  {
    q: 'Is my health data safe and private?',
    a: 'Absolutely. MediGuide AI is fully compliant with India\'s Digital Personal Data Protection Act (DPDPA) 2023. Your data is encrypted, never shared with third parties, and you can request deletion at any time from your profile.',
  },
  {
    q: 'What languages are supported?',
    a: 'MediGuide AI supports English, Hindi (हिंदी), and Marathi (मराठी). You can switch languages at any time. The AI, voice input, and all UI elements adapt to your chosen language.',
  },
  {
    q: 'How does the Indoor Navigation feature work?',
    a: 'Our indoor navigation uses detailed floor plans and a shortest-path algorithm (Dijkstra) to guide you through hospital corridors. Select your starting point and destination, and the app shows you a step-by-step animated route on the floor plan.',
  },
]

// ── Services Data ─────────────────────────────────────────────

const SERVICES = [
  {
    icon: FiMessageSquare,
    title: 'AI Symptom Assessment',
    desc: 'Describe your symptoms in your language. Our AI conducts a clinical-grade triage conversation, assesses urgency, and generates a downloadable Health Card for your doctor.',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    gradient: 'from-primary/10 to-primary-fixed/40',
  },
  {
    icon: FiMapPin,
    title: 'Hospital Finder',
    desc: 'Instantly locate nearby hospitals using GPS. Filter by government, private, or trust. View ratings, distance, emergency availability, and get one-tap directions.',
    iconBg: 'bg-tertiary/10',
    iconColor: 'text-tertiary',
    gradient: 'from-tertiary/10 to-tertiary-fixed/40',
  },
  {
    icon: FiNavigation,
    title: 'Indoor Navigation',
    desc: 'Navigate inside hospitals with interactive SVG floor plans. Multi-floor routing via lifts and staircases, with step-by-step voice directions in your language.',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    gradient: 'from-secondary/10 to-secondary-fixed/40',
  },
  {
    icon: FiUsers,
    title: 'Caregiver Dashboard',
    desc: 'A dedicated dashboard for caregivers and family members to monitor patient triage history, view health trends, and stay informed about their loved one\'s health journey.',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    gradient: 'from-primary/10 to-primary-fixed/40',
  },
]

// ── Stats ─────────────────────────────────────────────────────

const STATS = [
  { icon: FiGlobe, value: '3', label: 'Languages Supported' },
  { icon: FiShield, value: 'DPDPA', label: 'Compliant & Secure' },
  { icon: FiClock, value: '24/7', label: 'Always Available' },
  { icon: FiHeart, value: '100%', label: 'Free to Use' },
]

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="min-h-screen bg-surface font-sans antialiased">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* NAVIGATION BAR                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-clinical">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-clinical bg-primary-fixed/60 flex items-center justify-center">
                <span className="text-lg">🏥</span>
              </div>
              <span className="text-lg font-bold font-display text-on-surface">
                MediGuide <span className="text-primary">AI</span>
              </span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#about" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">About</a>
              <a href="#services" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">Services</a>
              <a href="#faq" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">FAQ</a>
              <Link
                to="/login"
                className="btn-primary px-5 py-2 text-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile CTA */}
            <Link to="/login" className="md:hidden btn-primary px-4 py-2 text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/30 via-surface to-secondary-fixed/20 pointer-events-none" />
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-secondary/5 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-clinical text-xs font-semibold text-primary">
              <FiActivity className="w-3.5 h-3.5" />
              AI-Powered Healthcare Assistant
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display text-on-surface leading-tight tracking-tight">
              Your Health,{' '}
              <span className="gradient-text">Intelligently</span>{' '}
              Guided
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
              AI-powered symptom assessment, hospital finder, and indoor navigation —
              all in <strong className="text-on-surface">Hindi, Marathi &amp; English</strong>.
              Free, private, and DPDPA compliant.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="btn-primary px-8 py-4 text-base flex items-center gap-2 shadow-clinical-lg hover:shadow-clinical-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Get Started — It's Free
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#services"
                className="px-8 py-4 rounded-clinical text-base font-semibold text-primary bg-white shadow-clinical hover:shadow-clinical-md transition-all duration-300"
              >
                Explore Features
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <FiShield className="w-3.5 h-3.5 text-tertiary" />
                DPDPA Compliant
              </div>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <FiGlobe className="w-3.5 h-3.5 text-primary" />
                3 Languages
              </div>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <FiHeart className="w-3.5 h-3.5 text-error" />
                100% Free
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* STATS STRIP                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="bg-white shadow-clinical">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-clinical bg-primary-fixed/40 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-extrabold font-display text-on-surface">{stat.value}</p>
                <p className="text-xs text-on-surface-variant font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ABOUT SECTION                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="about" className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-clinical-meta text-primary font-bold">ABOUT MEDIGUIDE AI</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-on-surface leading-tight">
              Bridging the Gap Between Patients and Healthcare
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
              MediGuide AI is an AI-powered healthcare platform designed for India's diverse population.
              We provide intelligent symptom assessment in Hindi, Marathi, and English — helping patients
              understand their symptoms, find nearby hospitals, navigate indoor facilities, and connect
              with caregivers. Our mission is to make quality healthcare guidance accessible, private,
              and available to everyone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="clinical-card p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-clinical bg-primary-fixed/40 flex items-center justify-center">
                  <FiActivity className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-on-surface">AI-Powered Triage</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Clinically-informed urgency assessment from described symptoms
                </p>
              </div>
              <div className="clinical-card p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-clinical bg-tertiary-fixed/40 flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-tertiary" />
                </div>
                <h3 className="text-sm font-bold text-on-surface">Privacy First</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Full DPDPA compliance with encrypted, user-controlled data
                </p>
              </div>
              <div className="clinical-card p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-clinical bg-secondary-fixed/40 flex items-center justify-center">
                  <FiGlobe className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="text-sm font-bold text-on-surface">Multilingual</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Full support for Hindi, Marathi, and English — voice included
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SERVICES SECTION                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="services" className="py-20 sm:py-24 bg-surface-container-low">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-14">
            <p className="text-clinical-meta text-primary font-bold">OUR SERVICES</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-on-surface leading-tight">
              Everything You Need, In One App
            </h2>
            <p className="text-base text-on-surface-variant max-w-2xl mx-auto">
              From symptom assessment to indoor hospital navigation — MediGuide AI is your complete healthcare companion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVICES.map((service, i) => (
              <div
                key={i}
                className="group clinical-card p-0 overflow-hidden hover:shadow-clinical-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient header strip */}
                <div className={`h-2 bg-gradient-to-r ${service.gradient}`} />
                <div className="p-6 sm:p-8 space-y-4">
                  <div className={`w-14 h-14 rounded-clinical-lg ${service.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <service.icon className={`w-6 h-6 ${service.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold font-display text-on-surface">{service.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CTA BANNER                                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-primary-container to-primary rounded-clinical-xl px-8 py-14 sm:px-14 sm:py-16 text-center shadow-clinical-xl">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 space-y-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-white leading-tight">
                Ready to Take Control of Your Health?
              </h2>
              <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto">
                Join thousands of users who trust MediGuide AI for intelligent, private,
                and multilingual healthcare guidance.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-clinical font-bold text-primary bg-white hover:bg-primary-fixed transition-all duration-300 shadow-clinical-lg text-base"
              >
                Start Your Free Assessment
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FAQ SECTION                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <p className="text-clinical-meta text-primary font-bold">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-on-surface">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={i}
                  className="clinical-card overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-surface-container-low/50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-on-surface pr-4">{item.q}</span>
                    <FiChevronDown
                      className={`w-5 h-5 text-on-surface-variant flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm text-on-surface-variant leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FOOTER                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <footer className="bg-on-surface text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-clinical bg-primary-container flex items-center justify-center">
                  <span className="text-lg">🏥</span>
                </div>
                <span className="text-lg font-bold font-display">MediGuide AI</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                AI-powered healthcare assistant for India. Multilingual symptom assessment,
                hospital finder, and indoor navigation.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white/40">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><a href="#about" className="text-sm text-white/60 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#services" className="text-sm text-white/60 hover:text-white transition-colors">Services</a></li>
                <li><a href="#faq" className="text-sm text-white/60 hover:text-white transition-colors">FAQ</a></li>
                <li><Link to="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white/40">Legal & Compliance</h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm text-white/60">
                  <FiShield className="w-3.5 h-3.5 text-tertiary" />
                  DPDPA 2023 Compliant
                </li>
                <li className="flex items-center gap-2 text-sm text-white/60">
                  <FiStar className="w-3.5 h-3.5 text-primary-fixed-dim" />
                  HL7 FHIR Compatible
                </li>
                <li className="text-sm text-white/60">
                  Not a medical device. For informational purposes only.
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} MediGuide AI. All rights reserved.
            </p>
            <p className="text-xs text-white/40">
              Made with ❤️ for India's healthcare
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
