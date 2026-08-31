import Link from "next/link";
import { Shield, Activity, Network, RefreshCw, ArrowLeft, Zap, TerminalSquare } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white relative">
      
      {/* ─── Grid Background ──────────────────────────────────────────────── */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem'
        }}
      />

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-950 text-white p-1.5 rounded-md">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight text-xl">AEGIS</span>
          </div>
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* ─── Hero Section ──────────────────────────────────────────────────── */}
      <main className="relative z-10 container mx-auto px-6 py-16 max-w-5xl space-y-20">
        <section className="space-y-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            How AEGIS Works
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
            A non-technical guide to understanding the next generation of Active Cyber Defense.
          </p>
        </section>

        {/* ─── The Problem ─────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/5 p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400" />
          <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            The Problem: Traditional Antivirus is Blind
          </h2>
          <div className="space-y-4 text-zinc-600 leading-relaxed text-lg">
            <p>
              Traditional security relies on <strong>"Signatures"</strong>. It's like having a wanted poster of a criminal. 
              If the criminal gets a haircut (changes their code slightly), the security guard (antivirus) lets them walk right through the front door.
            </p>
            <p>
              Ransomware changes its "look" millions of times a day. We cannot rely on wanted posters anymore. We have to look at <em>behavior</em>.
            </p>
          </div>
        </section>

        {/* ─── The Solution Grid ───────────────────────────────────────────── */}
        <section className="space-y-10">
          <h2 className="text-3xl font-bold tracking-tight text-center">The Four Pillars of AEGIS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Feature 1 */}
            <div className="rounded-2xl bg-white border border-zinc-200 shadow-xl shadow-zinc-900/5 overflow-hidden flex flex-col group hover:border-zinc-300 transition-colors">
              <div className="p-8 pb-6 border-b border-zinc-100 bg-zinc-50/50">
                <div className="p-3 bg-white text-zinc-950 rounded-xl border border-zinc-200 w-fit mb-6 shadow-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950">1. Shannon Entropy</h3>
              </div>
              <div className="p-8 space-y-6 flex-1">
                <p className="text-zinc-600 leading-relaxed">
                  Instead of looking for a virus by name, we look at the data itself. Normal text has low randomness. Encrypted data is 100% random. We measure this mathematically.
                </p>
                <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-100 text-sm">
                  <strong className="block mb-2 text-zinc-950">Example:</strong>
                  <span className="text-zinc-600">If a thief breaks into a library and starts translating all the books into a completely unreadable alien language, we don't need to know the thief's name. We just measure how unreadable the books are becoming.</span>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-white border border-zinc-200 shadow-xl shadow-zinc-900/5 overflow-hidden flex flex-col group hover:border-zinc-300 transition-colors">
              <div className="p-8 pb-6 border-b border-zinc-100 bg-zinc-50/50">
                <div className="p-3 bg-white text-zinc-950 rounded-xl border border-zinc-200 w-fit mb-6 shadow-sm">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950">2. The Faraday Cage</h3>
              </div>
              <div className="p-8 space-y-6 flex-1">
                <p className="text-zinc-600 leading-relaxed">
                  Ransomware needs the internet to steal your data and get encryption keys. The millisecond AEGIS detects an attack, it dynamically severs the network connection.
                </p>
                <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-100 text-sm">
                  <strong className="block mb-2 text-zinc-950">Example:</strong>
                  <span className="text-zinc-600">Imagine a bank robber trying to call their getaway driver. AEGIS doesn't just lock the bank doors; it instantly turns the entire building into a dead zone where cell phones have zero signal.</span>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-white border border-zinc-200 shadow-xl shadow-zinc-900/5 overflow-hidden flex flex-col group hover:border-zinc-300 transition-colors">
              <div className="p-8 pb-6 border-b border-zinc-100 bg-zinc-50/50">
                <div className="p-3 bg-white text-zinc-950 rounded-xl border border-zinc-200 w-fit mb-6 shadow-sm">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950">3. Zero-Trust Vaporization</h3>
              </div>
              <div className="p-8 space-y-6 flex-1">
                <p className="text-zinc-600 leading-relaxed">
                  AEGIS silently takes ultra-fast "snapshots" of your files. When malware strikes, AEGIS kills the process, deletes malicious files, and instantly restores the original files.
                </p>
                <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-100 text-sm">
                  <strong className="block mb-2 text-zinc-950">Example:</strong>
                  <span className="text-zinc-600">If someone throws paint on a famous painting, AEGIS doesn't try to wash the paint off. It vaporizes the vandal, deletes the ruined painting, and instantly pulls a perfect replica out of a vault.</span>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl bg-white border border-zinc-200 shadow-xl shadow-zinc-900/5 overflow-hidden flex flex-col group hover:border-zinc-300 transition-colors">
              <div className="p-8 pb-6 border-b border-zinc-100 bg-zinc-50/50">
                <div className="p-3 bg-white text-zinc-950 rounded-xl border border-zinc-200 w-fit mb-6 shadow-sm">
                  <TerminalSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950">4. The Counter-Strike</h3>
              </div>
              <div className="p-8 space-y-6 flex-1">
                <p className="text-zinc-600 leading-relaxed">
                  When ransomware encrypts files, it always drops a "Ransom Note" demanding Bitcoin. AEGIS intercepts this note before the user sees it, overwriting it with an AEGIS branded message.
                </p>
                <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-100 text-sm">
                  <strong className="block mb-2 text-zinc-950">Example:</strong>
                  <span className="text-zinc-600">The hacker tries to slide a ransom demand under your door. AEGIS intercepts the paper, erases the hacker's message, writes "NICE TRY - THREAT NEUTRALIZED" on it, and slides it back.</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-zinc-200 pt-10 pb-20 text-center text-sm font-medium text-zinc-500">
          Built for the Hackathon. Protecting the future of data.
        </footer>
      </main>
    </div>
  );
}
