/**
 * Landing Page
 * 
 * Hero section with CTA to open the studio.
 */

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-20">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-400">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              AI-Powered Music Workstation
            </div>

            {/* Heading */}
            <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
              The Creative Suite for the{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Modern Musician
              </span>
            </h1>

            {/* Description */}
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              Separate stems, convert audio to MIDI, and transform your music with 
              professional-grade AI tools. All in one workspace.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/studio"
                className="group flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/40"
              >
                Open Studio
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button className="flex h-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-8 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:border-zinc-600 hover:bg-zinc-800/50">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-8 border-t border-zinc-800 pt-8">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-white md:text-4xl">4</div>
                <div className="mt-2 text-sm font-medium text-zinc-500">Object Types</div>
              </div>
              <div className="flex flex-col items-center border-x border-zinc-800">
                <div className="text-3xl font-bold text-white md:text-4xl">∞</div>
                <div className="mt-2 text-sm font-medium text-zinc-500">Unlimited Projects</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">AI</div>
                <div className="mt-2 text-sm font-medium text-zinc-500">Powered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-zinc-800 bg-gradient-to-b from-zinc-900/50 to-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Everything you need to work with music
            </h2>
            <p className="text-lg text-zinc-400">
              Professional tools designed for creators
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Stem Separation</h3>
              <p className="leading-relaxed text-zinc-400">
                Isolate vocals, bass, drums, and instruments using state-of-the-art AI models. 
                Perfect for remixing, sampling, and analysis.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Audio to MIDI</h3>
              <p className="leading-relaxed text-zinc-400">
                Convert audio recordings to MIDI with precision. Edit melodies, transpose keys, 
                and manipulate your music like never before.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Multiple Views</h3>
              <p className="leading-relaxed text-zinc-400">
                Work with waveform, MIDI piano roll, and sheet music views. 
                Switch between perspectives for maximum creative flexibility.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Project-Centric</h3>
              <p className="leading-relaxed text-zinc-400">
                Organize everything in projects with hierarchical object trees. 
                Keep your workflow clean and your assets organized.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
