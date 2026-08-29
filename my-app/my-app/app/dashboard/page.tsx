'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, ShieldOff,
  Activity, AlertTriangle, CheckCircle2, XCircle,
  Play, Square, RotateCcw, Zap, FileWarning,
  Clock, Target, Wifi, WifiOff, Eye, Lock,
  ChevronRight, ArrowUpRight, Server, Cpu,
  FileText, FolderOpen, Network, TrendingUp,
} from 'lucide-react';
import { cn, formatMs, formatNumber } from '@/lib/utils';
import { useSSE } from '@/lib/use-sse';
import { useAgent } from '@/lib/use-agent';

// ─── Types ──────────────────────────────────────────────────────

interface ThreatSignal {
  signalType: string;
  score: number;
  maxScore: number;
  description: string;
  evidence: string;
}

interface TimelineEntry {
  timestamp: string;
  type: string;
  title: string;
  description: string;
  severity: string;
}

interface EventEntry {
  eventId: string;
  eventType: string;
  processName: string;
  filePath?: string;
  timestamp: string;
}

interface AgentStatus {
  running: boolean;
  aegisEnabled: boolean;
  workloadId: string | null;
  containerId: string | null;
  threatState: string;
  threatScore: number;
  signals: ThreatSignal[];
  metrics: {
    eventsProcessed: number;
    detectionTimeMs: number | null;
    containmentTimeMs: number | null;
    filesAtRisk: number;
    filesAffected: number;
    filesRecovered: number;
  };
  timeline: TimelineEntry[];
  c2IpAddress?: string | null;
  policy: {
    autonomyMode: string;
    thresholds: Record<string, number>;
  };
}

// ─── Main Dashboard ─────────────────────────────────────────────

export default function DashboardPage() {
  const { connected, subscribe } = useSSE();
  const agent = useAgent();

  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [threatScore, setThreatScore] = useState(0);
  const [threatState, setThreatState] = useState('NORMAL');
  const [signals, setSignals] = useState<ThreatSignal[]>([]);
  const [autonomyMode, setAutonomyMode] = useState('AUTO_CONTAIN');
  const [simRunning, setSimRunning] = useState(false);
  const [targetMode, setTargetMode] = useState<'in-process' | 'docker'>('docker');

  // Fetch initial status
  useEffect(() => {
    agent.getStatus().then((s) => {
      const data = s as AgentStatus;
      setStatus(data);
      setThreatScore(data.threatScore || 0);
      setThreatState(data.threatState || 'NORMAL');
      setSignals(data.signals || []);
      setTimeline(data.timeline || []);
      setAutonomyMode(data.policy?.autonomyMode || 'AUTO_CONTAIN');
    }).catch(() => {});
  }, []);

  // SSE subscriptions
  useEffect(() => {
    const unsubs = [
      subscribe('status', (data) => {
        const d = data as AgentStatus;
        setStatus(d);
        setAutonomyMode(d.policy?.autonomyMode || 'AUTO_CONTAIN');
      }),
      subscribe('threat', (data) => {
        const d = data as { score: number; state: string; signals: ThreatSignal[] };
        setThreatScore(d.score);
        setThreatState(d.state);
        setSignals(d.signals || []);
      }),
      subscribe('event', (data) => {
        setEvents((prev) => [...prev.slice(-99), data as EventEntry]);
      }),
      subscribe('timeline', (data) => {
        setTimeline((prev) => [...prev, data as TimelineEntry]);
      }),
      subscribe('metrics', (data) => {
        setStatus((prev) => prev ? { ...prev, metrics: data as AgentStatus['metrics'] } : prev);
      }),
      subscribe('containment', () => {
        agent.getStatus().then((s) => setStatus(s as AgentStatus)).catch(() => {});
      }),
      subscribe('recovery', () => {
        agent.getStatus().then((s) => setStatus(s as AgentStatus)).catch(() => {});
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe]);

  // ─── Actions ────────────────────────────────────────────────
  const handleStart = async () => {
    const containerId = targetMode === 'docker' ? 'aegis-target' : 'sim-container';
    await agent.startAgent(containerId, containerId);
    const s = await agent.getStatus() as AgentStatus;
    setStatus(s);
    setTimeline(s.timeline || []);
  };

  const handleReset = async () => {
    await agent.resetAgent();
    setEvents([]);
    setTimeline([]);
    setThreatScore(0);
    setThreatState('NORMAL');
    setSignals([]);
    setSimRunning(false);
    const s = await agent.getStatus() as AgentStatus;
    setStatus(s);
  };

  const handleSimulate = async (mode: string) => {
    if (!status?.running) {
      await handleStart();
      await new Promise((r) => setTimeout(r, 300));
    }
    setSimRunning(true);
    const simContainerId = targetMode === 'docker' ? 'aegis-simulator' : 'sim-container';
    await agent.startSimulation(mode, simContainerId, targetMode);
  };

  const handleToggleAegis = async () => {
    const newEnabled = !status?.aegisEnabled;
    await agent.toggleAegis(newEnabled);
    const s = await agent.getStatus() as AgentStatus;
    setStatus(s);
  };

  const handleAutonomyChange = async (mode: string) => {
    setAutonomyMode(mode);
    await agent.updatePolicy(mode);
  };

  const metrics = status?.metrics || {
    eventsProcessed: 0,
    detectionTimeMs: null,
    containmentTimeMs: null,
    filesAtRisk: 0,
    filesAffected: 0,
    filesRecovered: 0,
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white relative pb-12">


      {/* ─── Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="container flex h-16 max-w-[1600px] mx-auto items-center px-6 justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-950 text-white p-1.5 rounded-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none">AEGIS Security</h1>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                Runtime Threat Detection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {connected ? (
                <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> Live</>
              ) : (
                <><WifiOff className="w-3.5 h-3.5 text-destructive" /> Disconnected</>
              )}
            </div>
            <a
              href="/how-it-works"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3 border shadow-sm"
            >
              How It Works
            </a>
            <button
              onClick={handleToggleAegis}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border shadow-sm h-8 px-3",
                status?.aegisEnabled
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
              )}
            >
              {status?.aegisEnabled ? 'Protection Active' : 'Protection Disabled'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* ─── System Status Bar ───────────────────────────── */}
        <SystemStatusBar
          status={status}
          threatState={threatState}
          threatScore={threatScore}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* ─── Left Column: Controls & Metrics ───────────── */}
          <div className="xl:col-span-3 space-y-6">
            <ControlPanel
              status={status}
              simRunning={simRunning}
              autonomyMode={autonomyMode}
              targetMode={targetMode}
              onStart={handleStart}
              onReset={handleReset}
              onSimulate={handleSimulate}
              onAutonomyChange={handleAutonomyChange}
              onTargetChange={setTargetMode}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
              <MetricCard
                icon={Clock}
                label="Detection Time"
                value={formatMs(metrics.detectionTimeMs)}
                sub={metrics.detectionTimeMs ? 'from first anomaly' : 'awaiting'}
              />
              <MetricCard
                icon={Zap}
                label="Containment Time"
                value={formatMs(metrics.containmentTimeMs)}
                sub={metrics.containmentTimeMs ? 'total response' : 'awaiting'}
              />
            </div>
          </div>

          {/* ─── Middle Column: Threat Engine ──────────────── */}
          <div className="xl:col-span-6 space-y-6">
            {status?.c2IpAddress && (
              <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 text-card-foreground shadow-sm p-4 animate-in fade-in slide-in-from-top-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/20 rounded-full animate-pulse">
                    <Network className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-500 leading-none">Threat Intelligence Alert</h3>
                    <p className="text-xs text-rose-500/80 mt-1">Hostile Command & Control Server Blocked</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-rose-500 tracking-wider bg-rose-500/20 px-3 py-1 rounded border border-rose-500/30">
                    {status.c2IpAddress}
                  </p>
                </div>
              </div>
            )}
            
            <ThreatGauge score={threatScore} state={threatState} signals={signals} />
            
            <div className="grid grid-cols-3 gap-4">
              <MetricCard
                icon={FolderOpen}
                label="Monitored Files"
                value={formatNumber(metrics.filesAtRisk)}
                sub="in secure sandbox"
              />
              <MetricCard
                icon={FileWarning}
                label="Encrypted Files"
                value={formatNumber(metrics.filesAffected)}
                sub="by ransomware"
                destructive={metrics.filesAffected > 0}
              />
              <MetricCard
                icon={CheckCircle2}
                label="Files Recovered"
                value={`${formatNumber(metrics.filesRecovered)}`}
                sub={metrics.filesRecovered > 0 ? 'fully restored' : 'awaiting'}
                success={metrics.filesRecovered > 0}
              />
            </div>
          </div>

          {/* ─── Right Column: Timeline & Stream ───────────── */}
          <div className="xl:col-span-3 space-y-6">
            <AttackTimeline entries={timeline} />
            <EventStream events={events} />
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────

function SystemStatusBar({
  status,
  threatState,
  threatScore,
}: {
  status: AgentStatus | null;
  threatState: string;
  threatScore: number;
}) {
  const getStatusConfig = () => {
    if (!status?.running) return { icon: ShieldOff, text: 'SYSTEM OFFLINE', color: 'text-muted-foreground', border: 'border-muted' };
    if (!status.aegisEnabled) return { icon: ShieldOff, text: 'UNPROTECTED', color: 'text-destructive', border: 'border-destructive/30' };

    switch (threatState) {
      case 'NORMAL': return { icon: ShieldCheck, text: 'SYSTEM SECURE', color: 'text-emerald-500', border: 'border-emerald-500/30' };
      case 'OBSERVING': return { icon: Eye, text: 'OBSERVING ANOMALY', color: 'text-amber-500', border: 'border-amber-500/30' };
      case 'SUSPICIOUS': return { icon: AlertTriangle, text: 'SUSPICIOUS ACTIVITY', color: 'text-amber-500', border: 'border-amber-500/30' };
      case 'THREAT_DETECTED': return { icon: ShieldAlert, text: 'THREAT DETECTED', color: 'text-rose-500', border: 'border-rose-500/30' };
      case 'CONTAINING': return { icon: ShieldAlert, text: 'EXECUTING CONTAINMENT', color: 'text-rose-500', border: 'border-rose-500/30' };
      case 'CONTAINED': return { icon: Lock, text: 'THREAT CONTAINED', color: 'text-amber-500', border: 'border-amber-500/30' };
      case 'RECOVERING': return { icon: RotateCcw, text: 'RECOVERING DATA', color: 'text-blue-500', border: 'border-blue-500/30' };
      case 'RECOVERED': return { icon: CheckCircle2, text: 'SYSTEM RECOVERED', color: 'text-emerald-500', border: 'border-emerald-500/30' };
      case 'RESOLVED': return { icon: ShieldCheck, text: 'THREAT RESOLVED', color: 'text-emerald-500', border: 'border-emerald-500/30' };
      default: return { icon: Shield, text: threatState, color: 'text-muted-foreground', border: 'border-muted' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex items-center justify-between transition-colors duration-500", config.border)}>
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-full bg-background border shadow-sm", config.border)}>
          <Icon className={cn("w-6 h-6", config.color, threatState === 'THREAT_DETECTED' && "animate-pulse")} />
        </div>
        <div>
          <p className={cn("text-lg font-bold tracking-tight", config.color)}>{config.text}</p>
          <p className="text-sm text-muted-foreground">
            {status?.workloadId ? `Monitoring Workload: ${status.workloadId}` : 'No active workload'}
          </p>
        </div>
      </div>
      {threatScore > 0 && (
        <div className="text-right">
          <p className="text-3xl font-bold font-mono tracking-tighter">{threatScore}%</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Threat Score</p>
        </div>
      )}
    </div>
  );
}

function ControlPanel({
  status,
  simRunning,
  autonomyMode,
  targetMode,
  onStart,
  onReset,
  onSimulate,
  onAutonomyChange,
  onTargetChange,
}: {
  status: AgentStatus | null;
  simRunning: boolean;
  autonomyMode: string;
  targetMode: 'in-process' | 'docker';
  onStart: () => void;
  onReset: () => void;
  onSimulate: (mode: string) => void;
  onAutonomyChange: (mode: string) => void;
  onTargetChange: (mode: 'in-process' | 'docker') => void;
}) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold leading-none tracking-tight">Command Center</h3>
          <div className="inline-flex h-8 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <button 
              onClick={() => onTargetChange('docker')}
              className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all", targetMode === 'docker' ? "bg-background text-foreground shadow-sm" : "hover:text-foreground")}
            >
              Docker
            </button>
            <button 
              onClick={() => onTargetChange('in-process')}
              className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all", targetMode === 'in-process' ? "bg-background text-foreground shadow-sm" : "hover:text-foreground")}
            >
              Demo
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {!status?.running ? (
            <button onClick={onStart} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-zinc-950 text-white shadow hover:bg-zinc-800 h-10 px-4 py-2 w-full">
              <Play className="w-4 h-4 mr-2" /> Start AEGIS
            </button>
          ) : (
            <button onClick={onReset} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset Engine
            </button>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Simulation</h4>
          <button
            onClick={() => onSimulate('normal')}
            disabled={simRunning}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 w-full disabled:opacity-50"
          >
            <Server className="w-4 h-4 mr-2" /> Normal Traffic
          </button>
          <button
            onClick={() => onSimulate('ransomware')}
            disabled={simRunning}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 h-9 px-4 w-full disabled:opacity-50"
          >
            <Zap className="w-4 h-4 mr-2" /> Launch Ransomware
          </button>
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">Autonomy Policy</h4>
          {(['OBSERVE', 'SUGGEST', 'APPROVAL', 'AUTO_CONTAIN'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onAutonomyChange(mode)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors border",
                autonomyMode === mode
                  ? "bg-accent text-accent-foreground border-border shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {mode.replace('_', '-')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  success,
  destructive,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  success?: boolean;
  destructive?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm p-5", success && "border-emerald-500/30", destructive && "border-rose-500/30")}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("w-4 h-4", success ? "text-emerald-500" : destructive ? "text-rose-500" : "text-muted-foreground")} />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className={cn("text-2xl font-bold font-mono tracking-tight", success ? "text-emerald-500" : destructive ? "text-rose-500" : "text-foreground")}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function ThreatGauge({
  score,
  state,
  signals,
}: {
  score: number;
  state: string;
  signals: ThreatSignal[];
}) {
  const getBarColor = (s: number) => {
    if (s >= 75) return 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]';
    if (s >= 50) return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
    if (s >= 30) return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  const getBadgeClass = (s: string) => {
    if (s === 'NORMAL' || s === 'RECOVERED' || s === 'RESOLVED') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (s === 'OBSERVING' || s === 'SUSPICIOUS' || s === 'CONTAINED') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (s === 'THREAT_DETECTED' || s === 'CONTAINING') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    return 'bg-muted text-muted-foreground border-transparent';
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold leading-none tracking-tight">Threat Analysis Engine</h3>
        <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", getBadgeClass(state))}>
          {state}
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-10">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-muted-foreground">Current Risk Level</span>
          <span className="text-4xl font-black font-mono tracking-tighter">{score}%</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden border border-border/50">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-in-out", getBarColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-mono mt-2 px-1">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Signal breakdown */}
      {signals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold border-b border-border pb-2">Active Threat Vectors</h4>
          <div className="grid gap-3">
            {signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 border border-border/50 animate-in fade-in slide-in-from-bottom-2">
                <div className={cn(
                  "inline-flex items-center justify-center rounded-md font-mono font-bold text-sm px-2 py-1 border",
                  signal.score >= 50 ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : signal.score >= 20 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-background text-muted-foreground border-border"
                )}>
                  +{signal.score}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-foreground">{signal.description}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono bg-background/50 px-2 py-1 rounded inline-block truncate max-w-full border border-border/50">{signal.evidence}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {signals.length === 0 && score === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
          <ShieldCheck className="w-8 h-8 mb-3 text-muted-foreground/50" />
          <p className="text-sm font-medium">No anomalous activity detected.</p>
        </div>
      )}
    </div>
  );
}

function AttackTimeline({ entries }: { entries: TimelineEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-border bg-muted/20">
        <h3 className="font-semibold leading-none tracking-tight text-sm">Attack Timeline</h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Waiting for activity...
          </p>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-4 relative animate-in fade-in slide-in-from-left-2">
            {/* Timeline line */}
            {i < entries.length - 1 && (
              <div className="absolute left-[7px] top-[24px] bottom-[-16px] w-px bg-border" />
            )}
            <div className="mt-0.5 flex-shrink-0 relative z-10 bg-card">
              {getIcon(entry.severity)}
            </div>
            <div className="pb-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventStream({ events }: { events: EventEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getEventBadge = (type: string) => {
    if (type.includes('WRITE')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (type.includes('RENAME')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    if (type.includes('DELETE')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (type.includes('NETWORK')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (type.includes('PROCESS')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (type.includes('ENTROPY')) return 'bg-rose-500 text-white font-bold animate-pulse shadow-sm';
    return 'bg-muted text-muted-foreground border-transparent';
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col h-[350px]">
      <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
        <h3 className="font-semibold leading-none tracking-tight text-sm">Raw Telemetry Stream</h3>
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors bg-secondary text-secondary-foreground">
          {events.length} events
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {events.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Monitoring workload activity...
          </p>
        )}
        {events.map((event, i) => (
          <div key={i} className="flex gap-3 items-center text-xs animate-in fade-in">
            <span className="text-muted-foreground shrink-0 w-[60px] font-mono">
              {new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className={cn("shrink-0 inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-mono uppercase border", getEventBadge(event.eventType))}>
              {event.eventType}
            </span>
            <span className="text-foreground truncate font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
              {event.filePath || event.processName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
