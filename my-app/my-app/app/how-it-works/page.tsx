import Link from "next/link";
import { Shield, Activity, Network, RefreshCw, ArrowLeft, Zap, TerminalSquare } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-foreground" />
            <span className="font-bold tracking-tight text-lg">AEGIS Architecture</span>
          </div>
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* ─── Hero Section ──────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 py-12 max-w-4xl space-y-16">
        <section className="space-y-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            How AEGIS Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A non-technical guide to understanding the next generation of Active Cyber Defense.
          </p>
        </section>

        {/* ─── The Problem ─────────────────────────────────────────────────── */}
        <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            The Problem: Traditional Antivirus is Blind
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
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
        <section className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-center">The Four Pillars of AEGIS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feature 1 */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 pb-4 border-b bg-muted/30">
                <div className="p-3 bg-background rounded-lg border w-fit mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">1. Shannon Entropy (Detection)</h3>
              </div>
              <div className="p-6 space-y-4 flex-1">
                <p className="text-sm font-medium">What it is:</p>
                <p className="text-sm text-muted-foreground">
                  Instead of looking for a virus by name, we look at the data itself. Normal text (like English) has low randomness. Encrypted data is 100% random. We measure this randomness mathematically.
                </p>
                <div className="bg-muted p-4 rounded-md border text-sm">
                  <strong className="block mb-1">Example:</strong>
                  If a thief breaks into a library and starts translating all the books into a completely unreadable alien language, we don't need to know the thief's name to know something is wrong. We just measure how unreadable the books are becoming.
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 pb-4 border-b bg-muted/30">
                <div className="p-3 bg-background rounded-lg border w-fit mb-4">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">2. The Faraday Cage (Containment)</h3>
              </div>
              <div className="p-6 space-y-4 flex-1">
                <p className="text-sm font-medium">What it is:</p>
                <p className="text-sm text-muted-foreground">
                  Ransomware needs the internet to steal your data and get encryption keys from the hacker. The millisecond AEGIS detects an attack, it dynamically manipulates the network stack to sever the connection.
                </p>
                <div className="bg-muted p-4 rounded-md border text-sm">
                  <strong className="block mb-1">Example:</strong>
                  Imagine a bank robber trying to call their getaway driver. AEGIS doesn't just lock the bank doors; it instantly turns the entire building into a dead zone where cell phones have zero signal.
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 pb-4 border-b bg-muted/30">
                <div className="p-3 bg-background rounded-lg border w-fit mb-4">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">3. Zero-Trust Vaporization (Recovery)</h3>
              </div>
              <div className="p-6 space-y-4 flex-1">
                <p className="text-sm font-medium">What it is:</p>
                <p className="text-sm text-muted-foreground">
                  AEGIS silently takes ultra-fast "snapshots" of your files. When malware strikes, AEGIS kills the process, deletes the malicious files, and instantly restores the original files from the snapshot.
                </p>
                <div className="bg-muted p-4 rounded-md border text-sm">
                  <strong className="block mb-1">Example:</strong>
                  If someone throws paint on a famous painting, AEGIS doesn't try to wash the paint off. It vaporizes the vandal, deletes the ruined painting, and instantly pulls a perfect replica out of a hidden vault.
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 pb-4 border-b bg-muted/30">
                <div className="p-3 bg-background rounded-lg border w-fit mb-4">
                  <TerminalSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">4. The Counter-Strike (Hijack)</h3>
              </div>
              <div className="p-6 space-y-4 flex-1">
                <p className="text-sm font-medium">What it is:</p>
                <p className="text-sm text-muted-foreground">
                  When ransomware encrypts files, it always drops a "Ransom Note" demanding Bitcoin. AEGIS intercepts this note before the user sees it, overwriting it with an AEGIS branded message.
                </p>
                <div className="bg-muted p-4 rounded-md border text-sm">
                  <strong className="block mb-1">Example:</strong>
                  The hacker tries to slide a ransom demand under your door. AEGIS intercepts the paper, erases the hacker's message, writes "NICE TRY - THREAT NEUTRALIZED" on it, and slides it back.
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t pt-8 pb-16 text-center text-sm text-muted-foreground">
          Built for the Hackathon. Protecting the future of data.
        </footer>
      </main>
    </div>
  );
}
