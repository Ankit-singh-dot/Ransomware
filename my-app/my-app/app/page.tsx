import Link from "next/link";
import { Shield, Play, ArrowRight, Zap, Target, Activity, ShieldCheck, Database, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white overflow-hidden relative">
      
      {/* ─── Grid Background ──────────────────────────────────────────────── */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem'
        }}
      />

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header className="relative z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-950 text-white p-1.5 rounded-md">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight text-xl">AEGIS</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <Link href="/how-it-works" className="hover:text-zinc-950 transition-colors">How it works</Link>
            <Link href="#" className="hover:text-zinc-950 transition-colors">Features</Link>
            <Link href="#" className="hover:text-zinc-950 transition-colors">Pricing</Link>
          </nav>
          
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm font-medium hover:text-zinc-600 transition-colors hidden sm:block">Log in</Link>
            <Link 
              href="/dashboard" 
              className="bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main Hero Section ────────────────────────────────────────────── */}
      <main className="relative z-10 container mx-auto px-6 pt-24 pb-32 max-w-7xl flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Column: Copy */}
        <div className="flex-1 space-y-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold tracking-wide uppercase text-zinc-600">
            <div className="w-2 h-2 rounded-full bg-zinc-950 animate-pulse" />
            AEGIS ENGINE V2.0
          </div>
          
          <h1 className="text-[3.5rem] leading-[1.1] font-extrabold tracking-tight lg:text-[4.5rem]">
            Your infrastructure runs on <span className="text-zinc-950">intelligence.</span>
          </h1>
          
          <p className="text-lg text-zinc-600 leading-relaxed max-w-xl">
            Capture zero-day ransomware across Linux and container environments. Detect instantly, contain autonomously, and recover files—
            <strong className="text-zinc-950 font-semibold">zero human touch required.</strong>
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link 
              href="/dashboard"
              className="bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-4 rounded-full text-base font-semibold transition-all shadow-lg shadow-zinc-900/20 flex items-center gap-2 group"
            >
              Deploy Agent
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/how-it-works"
              className="bg-white hover:bg-zinc-50 text-zinc-950 border border-zinc-200 px-8 py-4 rounded-full text-base font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Demo
            </Link>
          </div>
          
          <div className="flex items-center gap-4 pt-8">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" /></div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-zinc-300 flex items-center justify-center overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="avatar" /></div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-zinc-400 flex items-center justify-center overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nala" alt="avatar" /></div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-zinc-500 flex items-center justify-center overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn" alt="avatar" /></div>
            </div>
            <div className="text-sm">
              <div className="flex text-amber-400 text-lg">★★★★★</div>
              <p className="text-zinc-500 mt-0.5">Trusted by <strong className="text-zinc-950">500+</strong> Security Teams</p>
            </div>
          </div>
        </div>
        
        {/* Right Column: Visual Mockup */}
        <div className="flex-1 relative w-full max-w-2xl lg:ml-auto">
          {/* Main App Frame */}
          <div className="relative rounded-2xl bg-white border border-zinc-200 shadow-2xl shadow-zinc-900/10 overflow-hidden transform md:rotate-2 md:hover:rotate-0 transition-transform duration-500">
            {/* Window Header */}
            <div className="h-10 bg-zinc-50 border-b border-zinc-100 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="mx-auto flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 rounded-md text-[10px] text-zinc-500 font-medium font-mono">
                <Shield className="w-3 h-3" />
                app.aegis.security
              </div>
            </div>
            
            {/* Dashboard Content Mockup */}
            <div className="p-6 bg-zinc-50/50 flex gap-6 h-[400px]">
              {/* Sidebar */}
              <div className="w-32 hidden sm:flex flex-col gap-3">
                <div className="flex items-center gap-2 text-zinc-950 font-bold mb-4">
                  <ShieldCheck className="w-5 h-5" /> AEGIS
                </div>
                <div className="px-3 py-2 bg-zinc-200/50 rounded-md text-xs font-semibold text-zinc-950 flex items-center gap-2"><Activity className="w-3.5 h-3.5"/> Overview</div>
                <div className="px-3 py-2 text-zinc-500 rounded-md text-xs font-medium flex items-center gap-2"><Target className="w-3.5 h-3.5"/> Threats</div>
                <div className="px-3 py-2 text-zinc-500 rounded-md text-xs font-medium flex items-center gap-2"><Database className="w-3.5 h-3.5"/> Recovery</div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-xl tracking-tight">System Overview</h3>
                  <p className="text-xs text-zinc-500">Active Workloads • Live Feed</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                    <p className="text-xs font-medium text-zinc-500 mb-1">Protected Files</p>
                    <p className="text-2xl font-bold">14,205</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> +1.2% secure</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                    <p className="text-xs font-medium text-zinc-500 mb-1">Threats Blocked</p>
                    <p className="text-2xl font-bold">382</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 0 bypasses</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm h-32 relative overflow-hidden">
                   <p className="text-xs font-medium text-zinc-500 mb-2">Entropy Analysis Trend</p>
                   {/* Fake Chart SVG */}
                   <svg className="w-full h-full text-zinc-200" preserveAspectRatio="none" viewBox="0 0 100 100">
                     <path d="M0,80 C20,70 40,90 60,50 C80,10 100,20 100,20 L100,100 L0,100 Z" fill="currentColor" opacity="0.5"/>
                     <path d="M0,80 C20,70 40,90 60,50 C80,10 100,20 100,20" fill="none" stroke="#18181b" strokeWidth="2"/>
                   </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating Badges */}
          <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="bg-zinc-950 text-white p-3 rounded-xl">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Threat Score</p>
              <div className="flex items-end gap-2 mt-0.5">
                <p className="text-2xl font-black leading-none">100<span className="text-zinc-400 text-lg">/100</span></p>
                <span className="text-xs font-bold text-rose-500 mb-0.5">↑ Critical</span>
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700 delay-500">
            <div className="bg-emerald-100 p-2.5 rounded-full text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-950">Zero-Trust Recovery</p>
              <p className="text-xs text-zinc-500">Files restored • 2 mins ago</p>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
