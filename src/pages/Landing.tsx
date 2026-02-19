import React from 'react';
import { ArrowRight, ShieldCheck, GraduationCap, CheckCircle2, Mail, Phone, Globe2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-slate-50 text-slate-900">
      {/* Hero / Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-blue-700">DiplomaVerif</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Trusted Credentials
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
              <a href="#about" className="hover:text-blue-600 transition-colors">
                About
              </a>
              <a href="#mission" className="hover:text-blue-600 transition-colors">
                Our Mission
              </a>
              <a href="#contact" className="hover:text-blue-600 transition-colors">
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/verify"
                className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                Verify a certificate
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Hero section */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -left-24 top-10 h-48 w-48 rounded-full bg-blue-100 blur-3xl" />
            <div className="absolute -right-10 top-32 h-56 w-56 rounded-full bg-sky-100 blur-3xl" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure digital diploma verification
                </span>

                <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
                  Build trust with{' '}
                  <span className="text-blue-700">
                    verifiable
                  </span>{' '}
                  academic credentials.
                </h1>

                <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl">
                  DiplomaVerif helps universities, employers, and students issue, share, and verify
                  diplomas instantly — reducing fraud and accelerating trust in academic records.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Get started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#about"
                    className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors"
                  >
                    Learn more
                  </a>
                </div>

                <dl className="mt-8 grid grid-cols-2 gap-4 max-w-md text-sm">
                  <div className="rounded-xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
                    <dt className="text-slate-500">For universities</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      Fast, secure diploma issuance
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
                    <dt className="text-slate-500">For employers</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      Instant verification of credentials
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-100 via-white to-sky-100 blur-2xl" />
                <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Live verification demo</p>
                        <p className="text-xs text-slate-500">Scan, validate, and confirm</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Online
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <div>
                        <p className="font-medium text-slate-800">QR code verification</p>
                        <p className="text-[11px] text-slate-500">
                          Verify diploma authenticity from any device.
                        </p>
                      </div>
                      <Link
                        to="/verify"
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-800"
                      >
                        Try now
                      </Link>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] font-semibold text-slate-800">
                          Verified diploma snapshot
                        </span>
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-slate-600">
                        <li>• Graduate: Jane Doe</li>
                        <li>• University: Global Tech University</li>
                        <li>• Program: B.Sc. Computer Science</li>
                        <li>• Status: <span className="font-semibold text-emerald-600">Authentic</span></li>
                      </ul>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      DiplomaVerif is designed for real-world deployment in universities and
                      organizations that need secure, verifiable academic records.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About section */}
        <section id="about" className="py-14 sm:py-16 bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  About <span className="text-blue-700">DiplomaVerif</span>
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-600">
                  DiplomaVerif is a digital platform built to modernize how academic diplomas are
                  issued, stored, and verified. Instead of relying on manual checks and paper
                  documents, we provide a secure, streamlined system that connects universities,
                  students, and third-party verifiers.
                </p>
                <p className="mt-3 text-sm sm:text-base text-slate-600">
                  By combining secure identifiers with intuitive tools, DiplomaVerif reduces
                  administrative workload, minimizes fraud, and gives graduates a simple way to
                  prove their achievements anywhere in the world.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-1">
                    Key benefits
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Instant verification of diplomas and transcripts.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Reduced risk of forged academic credentials.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Centralized management for universities and institutions.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Simple access for students through secure digital records.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission section */}
        <section id="mission" className="py-14 sm:py-16 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-2 items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-blue-300 mb-2">
                  Our mission
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Making academic achievements universally trusted and instantly verifiable.
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-300">
                  We believe that every genuine diploma should be easy to verify and impossible to
                  forge. Our mission is to empower educational institutions with tools that protect
                  the value of their programs, while giving graduates full control over how they
                  share their academic story.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <p className="text-xs font-semibold text-slate-300 mb-2">
                    What we focus on
                  </p>
                  <ul className="space-y-2 text-sm text-slate-200">
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Integrity and authenticity of digital credentials.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Seamless experience for universities, students, and verifiers.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Scalability for institutions of any size.
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <p className="text-xs font-semibold text-slate-300 mb-2">
                    Who it’s for
                  </p>
                  <p className="text-sm text-slate-200">
                    Universities, schools, professional training centers, employers, and
                    verification agencies that need a reliable way to validate academic records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact section */}
        <section id="contact" className="py-14 sm:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-blue-600 mb-2">
                  Contact us
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Let’s talk about secure diploma verification.
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-600">
                  Are you a university, organization, or employer interested in DiplomaVerif? Reach
                  out to discuss integrations, pilots, or full deployments tailored to your needs.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Email</p>
                      <a
                        href="mailto:contact@diplomaverif.com"
                        className="text-sm font-medium text-slate-800 hover:text-blue-700"
                      >
                        contact@diplomaverif.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Phone</p>
                      <p className="text-sm font-medium text-slate-800">+1 (000) 000-0000</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700">
                      <Globe2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Platform</p>
                      <p className="text-sm font-medium text-slate-800">Web-based, secure access</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">
                  Send a message
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                  className="space-y-3 text-sm"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="University, company, or institution"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      placeholder="Tell us how we can help you."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Send message
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1">
                    We typically respond within 1–2 business days.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} DiplomaVerif. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#about" className="hover:text-blue-700 transition-colors">
              About
            </a>
            <a href="#mission" className="hover:text-blue-700 transition-colors">
              Our Mission
            </a>
            <a href="#contact" className="hover:text-blue-700 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

