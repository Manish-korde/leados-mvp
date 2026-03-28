import { useState } from "react";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getIntensityColor = (v) => {
  const val = (v || "").toLowerCase();
  if (val === "high") return "bg-red-500/10 text-red-400 border-red-500/30";
  if (val === "medium") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  return "bg-slate-500/10 text-slate-400 border-slate-500/30";
};

const getPayColor = (v) => {
  const val = (v || "").toLowerCase();
  if (val === "high") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (val === "medium") return "bg-sky-500/10 text-sky-400 border-sky-500/30";
  return "bg-slate-500/10 text-slate-400 border-slate-500/30";
};

const getScoreColor = (s) => {
  if (s >= 8) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (s >= 7) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  return "text-rose-400 border-rose-500/30 bg-rose-500/10";
};

const STAGES = {
  DETECTED: "DETECTED",
  GENERATED: "GENERATED",
  VALIDATED: "VALIDATED"
};

const getSolutionTypeBadge = (type) => {
  const val = (type || "").toLowerCase();
  if (val === "saas") return { label: "SaaS", cls: "bg-violet-500/10 text-violet-400 border-violet-500/30" };
  if (val === "platform") return { label: "Platform", cls: "bg-sky-500/10 text-sky-400 border-sky-500/30" };
  return { label: "Service", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
};

// Fire-and-forget webhook
const fireWebhook = (path, body) =>
  fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});

// ─── Agent 2 call (shared) ─────────────────────────────────────────────────────
async function callAgent2(opp, angle = null) {
  const body = {
    solution: opp.solution,
    solution_type: opp.solution_type,
    audience: opp.audience,
    problem: opp.problem,
    pain_intensity: opp.pain_intensity,
    willingness_to_pay: opp.willingness_to_pay,
    ...(angle ? { angle } : {}),
  };

  const res = await fetch("/webhook/agent2-offer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error("Agent 2 Error: " + text.substring(0, 120));

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON from Agent 2.");
  }
}

// ─── Offer Panel ───────────────────────────────────────────────────────────────
function OfferPanel({ offerData, isWinner }) {
  const score = offerData.score || 0;
  const retries = offerData.retries || 0;
  const isForced = offerData.forced_accept;

  const getScoreColor = (s) => {
    if (s >= 5) return "text-emerald-400";
    if (s >= 3) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-800/80 space-y-6">
      {/* Quality Signals */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40"></div>
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Engineered Offer</h4>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-500 uppercase">Quality Score:</span>
            <span className={`text-xs font-black ${getScoreColor(score)}`}>{score}/7</span>
          </div>
        </div>
      </div>

      {isForced && (
        <div className="bg-rose-500/10 border border-rose-500/30 px-4 py-3 rounded-xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Low Confidence Output (Agent 2)</span>
        </div>
      )}

      {/* Main Core Offer Section */}
      <div className={`${isWinner ? 'bg-emerald-500/15 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-slate-950/80 border-slate-800/80'} p-5 rounded-2xl border shadow-2xl`}>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Core Solution Mechanism</p>
        <p className="text-xl font-black text-white leading-tight tracking-tight">
          {offerData.offer}
        </p>
      </div>

      <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/50">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Target ICP</p>
        <p className="text-sm text-slate-200 font-bold leading-snug">{offerData.ICP || offerData.icp}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Pricing Model</p>
          <p className="text-sm font-black text-emerald-400 tracking-tight">{offerData.pricing}</p>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Guarantee</p>
          <p className="text-sm text-slate-200 font-bold leading-tight">{offerData.guarantee}</p>
        </div>
      </div>

      <div className="bg-sky-500/10 p-5 rounded-2xl border border-sky-500/20 shadow-lg shadow-sky-500/5">
        <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-3">The Central Promise</p>
        <p className="text-lg text-sky-100 font-black italic leading-tight">
          "{offerData.promise}"
        </p>
      </div>
    </div>
  );
}

// ─── Funnel Panel ──────────────────────────────────────────────────────────────
function FunnelPanel({ funnel }) {
  if (!funnel) return null;

  return (
    <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="border-l-4 border-amber-500 pl-6 py-1">
        <h2 className="text-3xl font-black text-white tracking-tighter italic">Acquisition Funnel</h2>
        <p className="text-slate-600 text-[9px] font-black mt-1 uppercase tracking-widest">Translation: Opportunity → Execution System</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Strategy */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-[300px] h-full bg-amber-500/5 blur-[60px] -rotate-12 translate-x-20"></div>
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shadow-inner">🪝</div>
                 <div>
                   <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">The Hook</h4>
                   <p className="text-xs text-slate-500 font-bold mt-1 uppercase">Pattern Interrupt Angle</p>
                 </div>
               </div>
               <p className="text-2xl font-black text-white leading-tight tracking-tight italic">"{funnel.hook}"</p>
             </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xl shadow-inner">📄</div>
              <div>
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Landing Page Copy</h4>
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase">Conversion Optimized</p>
              </div>
            </div>
            
            <div className="space-y-6 pl-4 border-l-2 border-slate-800">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Headline</p>
                <p className="text-xl font-black text-white leading-tight">{funnel.landing_page.headline}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Subheadline</p>
                <p className="text-sm text-slate-400 font-bold leading-relaxed">{funnel.landing_page.subheadline}</p>
              </div>
              <div className="pt-2">
                <button className="bg-white text-slate-950 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-white/5 active:scale-95 transition-all">
                  {funnel.landing_page.cta}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Lead Magnet</h4>
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4 group hover:border-amber-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎁</div>
                <p className="text-xs font-black text-slate-200 leading-snug">{funnel.lead_magnet}</p>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Acquisition Channels</h4>
              <div className="flex flex-wrap gap-2">
                {funnel.acquisition_channels.map((chan, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-wider">{chan}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Roadmap */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shadow-inner">⚡</div>
              <div>
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">First 7-Day Launch</h4>
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase">Immediate Execution</p>
              </div>
            </div>

            <div className="space-y-6 relative border-l border-slate-800/80 ml-5 pr-2">
              {funnel.first_7_day_execution.map((step, i) => (
                <div key={i} className="relative pl-10">
                  <div className="absolute left-[-17px] top-0 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-white group hover:border-emerald-500/50 transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-xs font-bold text-slate-300 leading-relaxed mt-1 group-hover:text-white transition-colors">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl group hover:bg-emerald-500/20 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Next Phase</span>
                <span className="text-xs">→</span>
              </div>
              <p className="text-[11px] font-black text-white uppercase tracking-tight">Lock Implementation Plan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Opportunity Card ──────────────────────────────────────────────────────────
function OpportunityCard({ opp, index, onRetry }) {
  const isRevising = opp.isRevising;
  const typeBadge = getSolutionTypeBadge(opp.solution_type);

  // Validation Info
  const validationInfo = opp.validationInfo;
  const isValidated = !!validationInfo;
  const isSelected = validationInfo?.isSelected;
  const isNoGo = validationInfo?.decision === "NO-GO";
  const validationScore = validationInfo?.score;
  const validationReason = validationInfo?.reason;

  const cardBg = isSelected
    ? "border-emerald-500/80 bg-emerald-500/[0.08] shadow-[0_0_50px_rgba(16,185,129,0.2)] ring-2 ring-emerald-500/30 scale-[1.02]"
    : isNoGo
    ? "border-rose-500/20 opacity-40 grayscale saturate-0"
    : isValidated
    ? "border-slate-800 opacity-60"
    : opp.offerData
    ? "border-blue-500/50 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]"
    : isRevising
    ? "border-amber-500/40 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
    : "border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 active:scale-[0.98]";

  // Pipeline Stage Determination
  let currentStage = STAGES.DETECTED;
  if (isValidated) currentStage = STAGES.VALIDATED;
  else if (opp.offerData) currentStage = STAGES.GENERATED;

  return (
    <div className={`group rounded-2xl border p-6 flex flex-col transition-all duration-500 shadow-xl backdrop-blur-sm relative ${cardBg}`}>

      {/* Selected Ribbon */}
      {isSelected && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-black px-6 py-2 rounded-full text-[11px] uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(16,185,129,0.5)] z-20 whitespace-nowrap border-2 border-emerald-400">
          🏆 VALIDATED WINNER
        </div>
      )}

      {/* Status Banner */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-black text-[9px] uppercase tracking-widest ${
          isSelected ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
          isValidated && !isNoGo ? "bg-slate-800/40 text-slate-400 border-slate-700" :
          isNoGo ? "bg-rose-500/20 text-rose-400 border-rose-500/30" :
          currentStage === STAGES.GENERATED ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
          "bg-slate-800/40 text-slate-500 border-slate-700/50"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isSelected ? "bg-emerald-400 animate-pulse" :
            isNoGo ? "bg-rose-400" :
            currentStage === STAGES.GENERATED ? "bg-blue-400" : "bg-slate-600"
          }`}></div>
          STATUS: {isSelected ? "SELECTED" : isNoGo ? "NO-GO" : currentStage}
        </div>
        
        {isRevising && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg animate-pulse">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Regenerating...</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={`text-lg font-black leading-tight transition-colors ${isSelected ? "text-emerald-300" : "text-white group-hover:text-blue-400"}`}>
              {opp.solution}
            </h3>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-tight ${typeBadge.cls}`}>
              {typeBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">For</span>
            <span className="text-xs text-slate-400 font-semibold">{opp.audience}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          {isValidated && (
            <div className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase mb-1 flex items-center gap-1 ${getScoreColor(validationScore)}`}>
              Validation: {validationScore}/10
            </div>
          )}
          <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${getIntensityColor(opp.pain_intensity)}`}>
            Pain: {opp.pain_intensity}
          </span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${getPayColor(opp.willingness_to_pay)}`}>
            Pay: {opp.willingness_to_pay}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-6 flex-1">
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Problem Input (Signal)</h4>
          </div>
          <p className="text-base text-slate-200 leading-relaxed italic border-l-2 border-slate-800/80 pl-4 py-1">
            "{opp.problem}"
          </p>
        </section>

        {opp.evidence?.length > 0 && (
          <section className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Contextual Evidence</h4>
            {opp.evidence.slice(0, 2).map((ev, i) => (
              <div key={i} className="flex gap-3 items-start mb-2 last:mb-0">
                <div className="w-1 h-1 rounded-full bg-slate-700 mt-2 shrink-0"></div>
                <p className="text-xs text-slate-400 leading-snug tracking-tight italic">{ev}</p>
              </div>
            ))}
          </section>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/30">
          <div>
            <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1.5 font-bold">Market Frequency</h4>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{opp.frequency}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1.5 font-bold">Existing Friction</h4>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{opp.existing_solutions}</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isValidated ? "Validation Outcome" : "Model Alignment (Agent 2)"}
            </h4>
            <span className={`text-xs font-black ${isSelected ? 'text-emerald-500' : 'text-blue-500'}`}>{isValidated ? (isSelected ? '100' : '0') : opp.confidence_score}%</span>
          </div>
          <div className="w-full bg-slate-800/40 rounded-full h-1.5 overflow-hidden ring-1 ring-slate-800/10">
            <div
              className={`h-full transition-all duration-1000 ease-out shadow-lg ${isSelected ? 'bg-gradient-to-r from-emerald-600 to-green-400' : 'bg-gradient-to-r from-blue-600 to-sky-400'}`}
              style={{ width: `${isValidated ? (isSelected ? 100 : 0) : opp.confidence_score}%` }}
            />
          </div>
        </div>

        {validationReason && (
          <div className="pt-4 border-t border-slate-800/30">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isNoGo ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Validation Reasoning</h4>
            </div>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{validationReason}</p>
          </div>
        )}
      </div>

      {/* No individual actions anymore as per requirements */}

      {/* Loading */}
      {opp.isLoadingOffer && (
        <div className="mt-5 p-3 border-t border-slate-800/50 flex items-center gap-3 text-slate-500">
          <div className="w-4 h-4 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin shrink-0"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 animate-pulse">Engineering Offer...</span>
        </div>
      )}

      {opp.offerError && (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-shake">
          <div className="flex items-start gap-3 text-rose-400 mb-4">
             <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px] shrink-0">!</div>
             <p className="text-[11px] font-bold leading-tight">{opp.offerError}</p>
          </div>
          <button 
            onClick={() => onRetry(index)}
            className="w-full py-2 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20"
          >
            Retry Alpha Engine
          </button>
        </div>
      )}

      {opp.offerData && !opp.isLoadingOffer && <OfferPanel offerData={opp.offerData} isWinner={isSelected} />}
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
function Connector() {
  return (
    <div className="flex flex-col items-center py-6">
      <div className="w-px h-16 bg-gradient-to-b from-blue-500 to-transparent"></div>
    </div>
  );
}

function StepHeader({ num, title, subtitle, status }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center font-black text-xl text-white shadow-xl shadow-blue-500/20 ring-4 ring-slate-950">
          {num}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">{title}</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
      </div>
      {status && (
        <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
          status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-500 border-slate-800'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState(null);
  const [narrativeData, setNarrativeData] = useState(null);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("idle");
  const [funnelData, setFunnelData] = useState(null);
  const [isGeneratingFunnel, setIsGeneratingFunnel] = useState(false);
  const [trafficData, setTrafficData] = useState(null);
  const [isGeneratingTraffic, setIsGeneratingTraffic] = useState(false);
  const [outboundData, setOutboundData] = useState(null);
  const [isGeneratingOutbound, setIsGeneratingOutbound] = useState(false);

  const runOutboundAgent = async () => {
    if (!trafficData || !narrativeData || !funnelData) return;
    const winner = opportunities.find(o => o.validationInfo?.isSelected);
    if (!winner) return;

    setIsGeneratingOutbound(true);
    setError(null);
    setOutboundData(null);

    const payload = {
      selected_offer: {
        ICP: winner.offerData?.ICP || winner.offerData?.icp || winner.audience,
        offer: winner.offerData?.offer || winner.solution,
        pricing: winner.offerData?.pricing,
        promise: winner.offerData?.promise,
        guarantee: winner.offerData?.guarantee,
      },
      funnel: funnelData,
      narrative: narrativeData,
    };

    try {
      const res = await fetch("/webhook/agent7-outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error("Outbound Agent Failed: " + text.substring(0, 100));
      if (!text || text.trim() === "" || text.trim() === "null") {
        throw new Error("Empty response from Outbound Agent. Check n8n is active and try again.");
      }
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Outbound Agent returned malformed data. Retry.");
      }
      if (result.error) throw new Error(result.error);
      setOutboundData(result);
      setTimeout(() => {
        document.getElementById('outbound-output')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err) {
      setError("Outbound Simulation Failure: " + err.message);
    } finally {
      setIsGeneratingOutbound(false);
    }
  };

  const runTrafficAgent = async () => {
    if (!narrativeData || !funnelData) return;
    const winner = opportunities.find(o => o.validationInfo?.isSelected);
    if (!winner) return;

    setIsGeneratingTraffic(true);
    setError(null);
    setTrafficData(null);

    const payload = {
      ICP: winner.offerData?.ICP || winner.offerData?.icp || winner.audience,
      offer: winner.offerData?.offer || winner.solution,
      funnel: funnelData,
      narrative: narrativeData,
    };

    try {
      const res = await fetch("/webhook/agent6-paid-traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error("Traffic Agent Failed: " + text.substring(0, 100));
      const result = JSON.parse(text);
      if (result.error) throw new Error(result.error);
      setTrafficData(result);
      setTimeout(() => {
        document.getElementById('traffic-output')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err) {
      setError("Paid Traffic Engine Failure: " + err.message);
    } finally {
      setIsGeneratingTraffic(false);
    }
  };

  const runFunnelAgent = async () => {
    const winner = opportunities.find(o => o.validationInfo?.isSelected);
    if (!winner) {
      setError("No selected offer found to build a funnel.");
      return;
    }

    setIsGeneratingFunnel(true);
    setError(null);
    setFunnelData(null);

    try {
      const payload = {
        selected_offer: {
          ICP: winner.offerData?.ICP || winner.offerData?.icp,
          offer: winner.offerData?.offer,
          pricing: winner.offerData?.pricing,
          promise: winner.offerData?.promise,
          guarantee: winner.offerData?.guarantee
        },
        validation_context: {
          score: winner.validationInfo?.score,
          reason: winner.validationInfo?.reason
        }
      };

      const res = await fetch("/webhook/agent4-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Funnel Agent raw error:", text);
        throw new Error("Funnel Agent Failed: " + text.substring(0, 100));
      }
      
      const result = await res.json();
      console.log("Funnel Agent Result:", result);
      
      if (result.error) throw new Error(result.error);
      setFunnelData(result.funnel);
      
      // Scroll to funnel
      setTimeout(() => {
        document.getElementById('funnel-output')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (err) {
      setError("Funnel Engineering Failure: " + err.message);
    } finally {
      setIsGeneratingFunnel(false);
    }
  };

  const runNarrativeAgent = async () => {
    if (!funnelData || !opportunities.some(o => o.validationInfo?.isSelected)) return;
    
    setIsGeneratingNarrative(true);
    setError(null);

    const winner = opportunities.find(o => o.validationInfo?.isSelected);
    
    const payload = {
      ICP: winner.audience,
      offer: winner.solution,
      problem: winner.problem,
      hook: funnelData.hook || funnelData.funnel?.hook,
      landing_page: funnelData.landing_page || funnelData.funnel?.landing_page
    };

    try {
      const response = await fetch("/webhook/agent5-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setNarrativeData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const runValidationAgent = async () => {
    const candidates = opportunities.filter(o => o.offerData);

    if (candidates.length === 0) {
      setError("Generate offers before running validation.");
      return;
    }

    setIsSelecting(true);
    setError(null);

    try {
      const payload = {
        opportunities: candidates.map((o) => {
          // Find original index to maintain stable IDs
          const originalIdx = opportunities.findIndex(orig => orig === o);
          return {
            id: String(originalIdx),
            solution: o.solution,
            problem: o.problem,
            ...o.offerData
          };
        })
      };

      const res = await fetch("/webhook/agent3-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Validation Agent Failed");

      const result = await res.json();
      console.log("Validation Result:", result);
      
      if (result.error) throw new Error(result.error);
      
      setOpportunities(prev => prev.map((opp, idx) => {
        const idStr = String(idx);
        const evalItem = result.evaluations?.find(e => String(e.id) === idStr);
        const isSelected = result.selected_offer === idStr;

        if (evalItem) {
          return {
            ...opp,
            validationInfo: {
              ...evalItem,
              isSelected,
              summary: result.summary,
              final_decision: result.final_decision
            }
          };
        }
        return opp;
      }));

    } finally {
      setIsSelecting(false);
    }
  };

  const callAgent2 = async (opp, instructions = "") => {
    const res = await fetch("/webhook/agent2-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        solution: opp.solution,
        problem: opp.problem,
        audience: opp.audience,
        solution_type: opp.solution_type,
        pain_intensity: opp.pain_intensity,
        willingness_to_pay: opp.willingness_to_pay,
        instructions
      }),
    });
    
    const responseText = await res.text();
    
    if (!res.ok) {
        throw new Error(responseText.substring(0, 50) || "Webhook rejection");
    }

    if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from AI engine. Try retrying.");
    }

    try {
        return JSON.parse(responseText);
    } catch {
        throw new Error("AI returned malformed data. Try retrying.");
    }
  };

  const setOpp = (index, patch) => {
    setOpportunities((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleRetryOffer = async (index) => {
    setOpportunities(prev => {
      const next = [...prev];
      next[index] = { ...next[index], isLoadingOffer: true, offerError: null };
      return next;
    });

    try {
      const offerData = await callAgent2(opportunities[index]);
      setOpportunities(prev => {
        const next = [...prev];
        next[index] = { ...next[index], offerData, isLoadingOffer: false };
        return next;
      });
    } catch (err) {
      setOpportunities(prev => {
        const next = [...prev];
        next[index] = { ...next[index], offerError: err.message, isLoadingOffer: false };
        return next;
      });
    }
  };

  // ── Agent 1: Scan + immediately call Agent 2 for all results ───────────────
  const runAgent1 = async () => {
    setIsLoading(true);
    setError(null);
    setOpportunities([]);
    setFunnelData(null);
    setNarrativeData(null);
    setTrafficData(null);
    setOutboundData(null); // RESET ALL PIPELINE STATE
    setFeedbackStatus("idle");

    try {
      const response = await fetch("/webhook/agent1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const responseText = await response.text();

      if (!response.ok) {
        console.error("Agent 1 HTTP Error:", response.status, responseText);
        throw new Error(`Webhook Error (${response.status}): ${responseText.substring(0, 120)}`);
      }
      if (!responseText || responseText.trim() === "" || responseText === "null") {
        console.error("Agent 1 Empty Response:", responseText);
        throw new Error("Empty or invalid response from Agent 1. Check n8n logs.");
      }

      let data;
      try { data = JSON.parse(responseText); }
      catch { throw new Error("Invalid JSON from Agent 1."); }

      if (data === null) throw new Error("Agent 1 returned null.");

      let extracted = [];
      if (Array.isArray(data)) extracted = data;
      else if (data?.opportunities) extracted = data.opportunities;
      else if (data && typeof data === "object") {
        const arr = Object.values(data).find((v) => Array.isArray(v));
        if (arr) extracted = arr;
      }

      // Normalize: support both "service" (old) and "solution" (new) fields
      const normalized = extracted.map((opp) => ({
        solution: opp.solution || opp.service || "Unnamed Solution",
        solution_type: opp.solution_type || "service",
        audience: opp.audience || "Unknown",
        problem: opp.problem || "No problem defined",
        pain_intensity: opp.pain_intensity || "low",
        frequency: opp.frequency || "Rarely",
        evidence: Array.isArray(opp.evidence) ? opp.evidence : [],
        existing_solutions: opp.existing_solutions || "N/A",
        willingness_to_pay: opp.willingness_to_pay || "low",
        confidence_score: opp.confidence_score || 0,
        status: null,
        isLoadingOffer: false,
        isRevising: false,
        offerData: null,
        offerError: null,
      }));

      setOpportunities(normalized);

      // AUTOMATIC PROGRESSION: Call Agent 2 for all normalized results immediately
      for (let i = 0; i < normalized.length; i++) {
        const opp = normalized[i];
        setOpportunities(prev => {
          const next = [...prev];
          next[i] = { ...next[i], isLoadingOffer: true };
          return next;
        });

        try {
          const offerData = await callAgent2(opp);
          setOpportunities(prev => {
            const next = [...prev];
            next[i] = { ...next[i], offerData, isLoadingOffer: false };
            return next;
          });
        } catch (err) {
          setOpportunities(prev => {
            const next = [...prev];
            next[i] = { ...next[i], offerError: err.message, isLoadingOffer: false };
            return next;
          });
        }
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Feedback ──────────────────────────────────────────────────────────────
  const handlePassFeedback = async () => {
    if (!feedback.trim()) return;
    setFeedbackStatus("sending");

    const payload = {
      feedback,
      opportunities: opportunities.map((o) => ({
        solution: o.solution,
        solution_type: o.solution_type,
        audience: o.audience,
        problem: o.problem,
        validated: !!o.validationInfo,
        isSelected: o.validationInfo?.isSelected
      })),
      selected: opportunities.filter((o) => o.validationInfo?.isSelected).map((o) => o.solution),
      rejected: opportunities.filter((o) => o.validationInfo?.decision === "NO-GO").map((o) => o.solution),
    };

    try {
      await fetch("/webhook/refine-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setFeedbackStatus("sent");
      setFeedback("");
      setTimeout(() => setFeedbackStatus(null), 3000);
    } catch {
      setFeedbackStatus("error");
      setTimeout(() => setFeedbackStatus(null), 3000);
    }
  };

  const selectedCount = opportunities.filter((o) => o.validationInfo?.isSelected).length;
  const rejectedCount = opportunities.filter((o) => o.validationInfo?.decision === "NO-GO").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-sky-600/4 blur-[100px] rounded-full"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        
        {/* ── Hero Section ── */}
        <header className="text-center mb-24">
          <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-400 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg shadow-blue-500/20">L</div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">LeadOS v2.0 · Decision Layer</span>
          </div>
          
          <div className="flex justify-center gap-4 mb-4">
             <a 
               href="http://localhost:5678" 
               target="_blank" 
               rel="noreferrer"
               className="px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:border-blue-500/40 hover:text-blue-400 transition-all flex items-center gap-2"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
               Open n8n Workflows
             </a>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-6 italic leading-[0.9]">
            From Market Signals to<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Scalable Revenue Systems</span>
          </h1>
          
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            LeadOS discovers opportunities, generates offers, validates them, and builds go-to-market funnels — with autonomous execution automation in progress.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4">
            <button
              id="btn-trigger-agent1"
              onClick={runAgent1}
              disabled={isLoading}
              className={`h-16 px-12 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-4 ${
                isLoading
                  ? "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
                  : "bg-white text-slate-950 hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                  Searching for Signals...
                </>
              ) : (
                "Trigger Intelligence Scout"
              )}
            </button>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Connects to Reddit, Groq & Agentic Decision Layer</p>
          </div>
        </header>

        {error && (
          <div className="mb-12 bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl flex items-center gap-4 text-rose-400 animate-in fade-in slide-in-from-top-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center font-black text-xl border border-rose-500/20 shrink-0">!</div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Signal Disruption Detected</p>
              <p className="text-sm font-bold opacity-80">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-[10px] font-black opacity-40 hover:opacity-100 uppercase tracking-widest shrink-0 px-4 py-2 hover:bg-rose-500/10 rounded-xl transition-all">Dismiss</button>
          </div>
        )}

        {opportunities.length > 0 ? (
          <div className="space-y-4 animate-in fade-in duration-1000">
            
            {/* ── Step 1: Signals ── */}
            <section id="step-1" className="bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm">
              <StepHeader 
                num="01" 
                title="Market Intelligence" 
                subtitle="Lead Signal Extraction Engine"
                status="Active"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-slate-950/50 rounded-3xl border border-slate-800/50 p-8">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Signal Cluster Analysis</p>
                  <div className="flex items-end gap-2 mb-6">
                    <span className="text-5xl font-black text-white">{opportunities.length}</span>
                    <span className="text-sm font-black text-slate-500 uppercase pb-2">Verified Pain Points Captured</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {Array.from(new Set(opportunities.map(o => o.solution_type))).map(type => (
                      <div key={type} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        {type}: {opportunities.filter(o => o.solution_type === type).length}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-600/10 to-sky-500/5 rounded-3xl border border-blue-500/20 p-8 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Internal Status</p>
                  <p className="text-xl font-black text-white leading-tight">Agent 1 successfully mapped clusters.</p>
                </div>
              </div>
            </section>

            <Connector />

            {/* ── Step 2: Offers ── */}
            <section id="step-2" className="bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm">
              <StepHeader 
                num="02" 
                title="Opportunity Engineering" 
                subtitle="Bespoke Value Proposition Generation"
                status={opportunities.every(o => o.offerData) ? "Completed" : "Processing"}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {opportunities.map((opp, idx) => (
                  <OpportunityCard key={idx} opp={opp} index={idx} onRetry={handleRetryOffer} />
                ))}
              </div>
            </section>

            {/* ── Step 3: Decision (ONLY SHOW WHEN STEP 2 FINISHED) ── */}
            {!opportunities.some(o => o.isLoadingOffer) && (
              <>
                <Connector />
                <section id="step-3" className="bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                   {/* Decorative Gradient */}
                   <div className="absolute top-0 right-0 w-[500px] h-full bg-emerald-500/[0.03] blur-[100px] pointer-events-none"></div>

                   <StepHeader 
                     num="03" 
                     title="Systematic Decision Node" 
                     subtitle="Stress Test & Winner Selection"
                     status={opportunities.some(o => o.validationInfo) ? "Finalized" : "Pending Approval"}
                   />

                   {!opportunities.some(o => o.validationInfo) ? (
                     <div className="flex flex-col items-center py-12 text-center bg-slate-950/50 rounded-3xl border border-slate-800/50 border-dashed">
                       <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/30 rounded-full flex items-center justify-center text-3xl mb-6">⚖️</div>
                       <h3 className="text-2xl font-black text-white italic mb-2">Gate Awaiting Batch Approval</h3>
                       <p className="text-slate-500 text-sm max-w-md mx-auto mb-10 leading-relaxed font-medium capitalize">
                         The system has engineered {opportunities.length} potential vectors. Click approve to run comparative validation and pick the alpha opportunity.
                       </p>
                       <button
                         id="btn-trigger-validation"
                         onClick={runValidationAgent}
                         disabled={isSelecting || !opportunities.every(o => o.offerData)}
                         className={`h-16 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 ${
                           isSelecting
                             ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                             : opportunities.every(o => o.offerData)
                             ? "bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 scale-105"
                             : "bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed"
                         }`}
                       >
                         {isSelecting ? (
                           <>
                             <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                             Executing Stress Test...
                           </>
                         ) : (
                           "APPROVE BATCH (SECURE DECISION)"
                         )}
                       </button>
                     </div>
                   ) : (
                     <div className="space-y-12">
                       {/* Decision Summary */}
                       <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl flex items-center justify-between">
                         <div>
                           <div className="flex items-center gap-2 mb-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Alpha Outcome Locked</p>
                           </div>
                           <h3 className="text-3xl font-black text-white italic tracking-tighter">
                             {opportunities.some(o => o.validationInfo?.isSelected) ? "Winning Opportunity Identified" : "No Market Fit Found"}
                           </h3>
                           <p className="text-slate-400 text-sm mt-3 font-medium max-w-xl">
                             {opportunities.find(o => o.validationInfo?.isSelected)?.validationInfo?.summary || "System has evaluated all vectors against market friction and willingness to pay."}
                           </p>
                           
                           <div className="flex items-center gap-4 mt-6">
                             <button 
                               onClick={runAgent1}
                               className="px-4 py-2 bg-slate-950/80 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500/10 transition-all"
                             >
                               🔄 Revise Batch
                             </button>
                             <button 
                               onClick={() => setOpportunities([])}
                               className="px-4 py-2 bg-slate-950/80 border border-rose-500/30 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500/10 transition-all"
                             >
                               ✖ Restart Pipeline
                             </button>
                           </div>
                         </div>
                         <div className="hidden md:flex flex-col items-center gap-2 px-8 py-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                            <span className="text-[9px] font-black text-slate-600 uppercase">Evaluated</span>
                            <span className="text-3xl font-black text-white">{opportunities.length}</span>
                         </div>
                       </div>

                       {/* Split Winner vs Others */}
                       <div className="space-y-8">
                          {opportunities.filter(o => o.validationInfo?.isSelected).map((opp, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -top-10 left-6 text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em]">SYSTEM SELECTION:</div>
                              <OpportunityCard opp={opp} index={opportunities.indexOf(opp)} onRetry={handleRetryOffer} />
                            </div>
                          ))}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-60 grayscale scale-95 origin-top">
                            {opportunities.filter(o => !o.validationInfo?.isSelected).map((opp, idx) => (
                              <div key={idx} className="relative">
                                <div className="absolute -top-6 left-6 text-[9px] font-black text-rose-500/60 uppercase tracking-widest">REJECTED BY SYSTEM</div>
                                <OpportunityCard opp={opp} index={opportunities.indexOf(opp)} onRetry={handleRetryOffer} />
                              </div>
                            ))}
                          </div>
                       </div>

                       {/* Next Phase Action */}
                       {opportunities.some(o => o.validationInfo?.isSelected) && (
                         <div className="flex justify-center pt-8">
                           <button
                             id="btn-trigger-agent4"
                             onClick={runFunnelAgent}
                             disabled={isGeneratingFunnel}
                             className={`h-16 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 ${
                               isGeneratingFunnel
                                 ? "bg-slate-800 text-slate-500 animate-pulse"
                                 : "bg-emerald-500 text-slate-950 hover:bg-white shadow-xl shadow-emerald-500/20 scale-110"
                             }`}
                           >
                             {isGeneratingFunnel ? (
                               <>
                                 <div className="w-4 h-4 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
                                 Engineering Go-to-Market Blueprint...
                               </>
                             ) : (
                               "GENERATE GO-TO-MARKET PLAN"
                             )}
                           </button>
                         </div>
                       )}

                       {/* Quick Reset for when finalized */}
                       {!opportunities.some(o => o.validationInfo?.isSelected) && (
                         <div className="flex justify-center pt-10 gap-4">
                           <button 
                             onClick={runAgent1}
                             className="h-12 px-8 bg-slate-950/80 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-amber-500/10 transition-all"
                           >
                             🔄 Revise Batch
                           </button>
                           <button 
                             onClick={() => setOpportunities([])}
                             className="h-12 px-8 bg-slate-950/80 border border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all"
                           >
                             ✖ Restart
                           </button>
                         </div>
                       )}
                     </div>
                   )}
                </section>
              </>
            )}


            <Connector />

            {/* ── Step 4: Funnel ── */}
            <section id="step-4" className={`${funnelData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader 
                num="04" 
                title="GTM Blueprint" 
                subtitle="Full Acquisition Funnel Asset Generation"
                status={funnelData ? "Ready" : "Awaiting Decision"}
              />
              <div id="funnel-output">
                {funnelData ? (
                  <FunnelPanel funnel={funnelData} />
                ) : (
                  <div className="py-20 flex flex-col items-center border-2 border-dashed border-slate-800 rounded-[32px]">
                    <div className="text-4xl mb-4 grayscale opacity-30">🕸️</div>
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Output node dormant. Complete Step 3 to activate.</p>
                  </div>
                )}
              </div>
            </section>

             <Connector />

            {/* ── Step 5: Messaging Architecture ── */}
            <section id="step-5" className={`${narrativeData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader 
                num="05" 
                title="Narrative Builder" 
                subtitle="Positioning & Multi-Channel Outreach Assets"
                status={narrativeData ? "Finalized" : (funnelData ? "Awaiting Activation" : "Dormant")}
              />
              
              {!narrativeData ? (
                 <div className="py-20 flex flex-col items-center">
                    <button
                      onClick={runNarrativeAgent}
                      disabled={isGeneratingNarrative || !funnelData}
                      className={`h-16 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 ${
                        isGeneratingNarrative
                          ? "bg-slate-800 text-slate-500 animate-pulse"
                          : (funnelData 
                              ? "bg-white text-slate-950 hover:bg-blue-400 active:scale-95 shadow-xl shadow-white/10" 
                              : "bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed")
                      }`}
                    >
                      {isGeneratingNarrative ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-500 rounded-full animate-spin"></div>
                          Architecting Messaging Narrative...
                        </>
                      ) : (
                        "BUILD OUTREACH NARRATIVE"
                      )}
                    </button>
                    {!funnelData && <p className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Complete Step 4 GTM blueprint to unlock narrative layer.</p>}
                 </div>
              ) : (
                <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
                  {/* Core Position */}
                  <div className="bg-slate-950/80 p-8 rounded-3xl border border-slate-800/50 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full"></div>
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Core Market Positioning</p>
                     <p className="text-3xl font-black text-white italic tracking-tighter leading-tight italic">"{narrativeData.core_message}"</p>
                  </div>

                  {/* Messaging Angles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {narrativeData.angles.map((angle, idx) => (
                      <div key={idx} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${angle.type === 'pain' ? 'bg-rose-500' : angle.type === 'outcome' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                           Angle: {angle.type}
                        </p>
                        <p className="text-[13px] text-slate-400 font-bold leading-relaxed">{angle.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Operational Assets */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                           <header className="flex justify-between items-center mb-6">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">LinkedIn / Social Angle</span>
                              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase rounded">Ready</span>
                           </header>
                           <p className="text-[13px] text-slate-400 font-bold whitespace-pre-wrap leading-relaxed">{narrativeData.assets.linkedin_post}</p>
                        </div>
                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                           <header className="flex justify-between items-center mb-6">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cold DM / Direct Angle</span>
                              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded">Ready</span>
                           </header>
                           <p className="text-[13px] text-slate-400 font-bold whitespace-pre-wrap leading-relaxed">{narrativeData.assets.cold_dm}</p>
                        </div>
                     </div>
                     <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col">
                        <header className="flex justify-between items-center mb-6">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Sequence Asset</span>
                           <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase rounded">Ready</span>
                        </header>
                        <p className="text-[13px] text-slate-400 font-bold whitespace-pre-wrap leading-relaxed flex-1">{narrativeData.assets.email}</p>
                     </div>
                  </div>
                </div>
              )}
            </section>

            <Connector />

            {/* ── Step 6: Paid Traffic Layer ── */}
            <section id="step-6" className={`${trafficData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader
                num="06"
                title="Paid Traffic Layer"
                subtitle="Channel Strategy & Budget Intelligence"
                status={trafficData ? "Live" : (narrativeData ? "Awaiting Activation" : "Dormant")}
              />

              {!trafficData ? (
                <div className="py-20 flex flex-col items-center">
                  <button
                    onClick={runTrafficAgent}
                    disabled={isGeneratingTraffic || !narrativeData}
                    className={`h-16 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 ${
                      isGeneratingTraffic
                        ? "bg-slate-800 text-slate-500 animate-pulse"
                        : narrativeData
                          ? "bg-violet-600 text-white hover:bg-violet-500 shadow-xl shadow-violet-600/30 scale-105"
                          : "bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    {isGeneratingTraffic ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-violet-400 rounded-full animate-spin"></div>
                        Calculating Traffic Plan...
                      </>
                    ) : (
                      "GENERATE PAID TRAFFIC PLAN"
                    )}
                  </button>
                  {!narrativeData && <p className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Complete Step 5 Narrative to unlock traffic layer.</p>}
                </div>
              ) : (
                <div id="traffic-output" className="space-y-10 animate-in fade-in zoom-in-95 duration-700">

                  {/* Summary Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-gradient-to-br from-violet-600/10 to-purple-500/5 border border-violet-500/20 rounded-3xl p-8">
                      <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-2">Blended Performance Estimate</p>
                      <div className="flex items-end gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Daily Budget</p>
                          <p className="text-4xl font-black text-white">${trafficData.total_budget}<span className="text-lg text-slate-500">/day</span></p>
                        </div>
                        <div className="ml-8">
                          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Blended CPL</p>
                          <p className="text-4xl font-black text-violet-400">${trafficData.blended_cpl}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">AI Reasoning</p>
                      <p className="text-[12px] text-slate-400 font-bold leading-relaxed italic">"{trafficData.reasoning}"</p>
                    </div>
                  </div>

                  {/* Channel Cards */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Channel Breakdown</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {(trafficData.channels || []).map((ch, i) => (
                        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-7 space-y-6 hover:border-violet-500/30 transition-all">

                          {/* Channel Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-lg">
                                {ch.channel?.toLowerCase().includes('linkedin') ? '💼' :
                                 ch.channel?.toLowerCase().includes('google') ? '🔍' :
                                 ch.channel?.toLowerCase().includes('meta') || ch.channel?.toLowerCase().includes('facebook') ? '📘' :
                                 ch.channel?.toLowerCase().includes('tiktok') ? '🎵' : '📣'}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white">{ch.channel}</h4>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{ch.objective}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-600 uppercase">Allocation</p>
                              <p className="text-xl font-black text-violet-400">{ch.budget?.allocation_percent}%</p>
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { label: 'CPC', value: `$${ch.performance_estimate?.cpc}` },
                              { label: 'CTR', value: `${ch.performance_estimate?.ctr}%` },
                              { label: 'CVR', value: `${ch.performance_estimate?.conversion_rate}%` },
                              { label: 'CPL', value: `$${ch.performance_estimate?.cpl}` },
                            ].map(m => (
                              <div key={m.label} className="bg-slate-950/80 rounded-xl p-3 text-center border border-slate-800/60">
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{m.label}</p>
                                <p className="text-sm font-black text-white">{m.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Expected Leads */}
                          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Expected Leads / Day</p>
                            <p className="text-2xl font-black text-white">{ch.performance_estimate?.expected_leads_per_day}</p>
                          </div>

                          {/* Budget */}
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Daily Budget</p>
                            <p className="text-sm font-black text-white">${ch.budget?.daily_budget}/day</p>
                          </div>

                          {/* Targeting */}
                          <div className="space-y-2 pt-4 border-t border-slate-800/50">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Targeting</p>
                            <div className="flex flex-wrap gap-2">
                              {[ch.targeting?.persona, ch.targeting?.geo, ch.targeting?.age_range].filter(Boolean).map((t, j) => (
                                <span key={j} className="px-3 py-1 bg-slate-800/60 border border-slate-700/50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-wider">{t}</span>
                              ))}
                            </div>
                            {ch.targeting?.interests?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {ch.targeting.interests.map((int, j) => (
                                  <span key={j} className="px-2 py-0.5 rounded text-[9px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20">{int}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Creatives */}
                          {ch.creatives?.length > 0 && (
                            <div className="space-y-2 pt-4 border-t border-slate-800/50">
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Ad Creatives</p>
                              {ch.creatives.map((cr, j) => (
                                <div key={j} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 uppercase">{cr.type}</span>
                                    <span className="text-[9px] font-black text-slate-600 uppercase">{cr.angle}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-bold italic leading-relaxed">"{cr.hook}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <Connector />

            {/* ── Step 7: Outbound Outreach Simulation ── */}
            <section id="step-7" className={`${outboundData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader
                num="07"
                title="Outbound Simulation"
                subtitle="ICP Targeting, Prospect Mapping & Outreach Sequencing"
                status={outboundData ? "Simulated" : (trafficData ? "Awaiting Activation" : "Dormant")}
              />

              {!outboundData ? (
                <div className="py-20 flex flex-col items-center">
                  <button
                    onClick={runOutboundAgent}
                    disabled={isGeneratingOutbound || !trafficData}
                    className={`h-16 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 ${
                      isGeneratingOutbound
                        ? "bg-slate-800 text-slate-500 animate-pulse"
                        : trafficData
                          ? "bg-rose-600 text-white hover:bg-rose-500 shadow-xl shadow-rose-600/30 scale-105"
                          : "bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    {isGeneratingOutbound ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-rose-400 rounded-full animate-spin"></div>
                        Simulating Outbound Strategy...
                      </>
                    ) : (
                      "SIMULATE OUTBOUND OUTREACH"
                    )}
                  </button>
                  {!trafficData && <p className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Complete Step 6 Paid Traffic to unlock outbound layer.</p>}
                </div>
              ) : (
                <div id="outbound-output" className="space-y-10 animate-in fade-in zoom-in-95 duration-700">

                  {/* Targeting + Volume Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 rounded-3xl p-8 space-y-5">
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">ICP Targeting Profile</p>
                      <p className="text-xl font-black text-white">{outboundData.targeting?.persona}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Industry</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(outboundData.targeting?.company_criteria?.industry || []).map((ind, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-black text-slate-400 uppercase">{ind}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Company Size</p>
                          <p className="text-xs font-black text-slate-300">{outboundData.targeting?.company_criteria?.company_size}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Geography</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(outboundData.targeting?.company_criteria?.geography || []).map((geo, i) => (
                              <span key={i} className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded text-[9px] font-black text-sky-400 uppercase">{geo}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Platforms</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(outboundData.targeting?.platforms || []).map((p, i) => (
                              <span key={i} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[9px] font-black text-rose-400 uppercase">{p}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {outboundData.targeting?.company_criteria?.signals?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Trigger Signals</p>
                          <div className="flex flex-wrap gap-2">
                            {outboundData.targeting.company_criteria.signals.map((sig, i) => (
                              <span key={i} className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-black text-amber-400">⚡ {sig}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Volume Plan */}
                    <div className="bg-gradient-to-br from-rose-600/10 to-pink-500/5 border border-rose-500/20 rounded-3xl p-8 flex flex-col justify-between">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-6">Volume Plan</p>
                      <div className="space-y-5">
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Daily Outreach</p>
                          <p className="text-4xl font-black text-white">{outboundData.volume_plan?.daily_outreach}<span className="text-slate-500 text-sm"> contacts</span></p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Response Rate</p>
                          <p className="text-2xl font-black text-rose-400">{outboundData.volume_plan?.expected_response_rate}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Meetings / Week</p>
                          <p className="text-2xl font-black text-emerald-400">{outboundData.volume_plan?.expected_meetings_per_week}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prospect Simulation */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5">Simulated Prospects</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(outboundData.prospect_simulation || []).map((p, i) => (
                        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-rose-500/30 transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-sm">
                              {p.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white leading-tight">{p.name}</p>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{p.role}</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-black text-rose-400 mb-2">{p.company}</p>
                          <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{p.reason_fit}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outreach Sequence + Message Variants */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sequence */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Outreach Sequence</p>
                      <div className="space-y-5 relative border-l border-slate-800/80 ml-4">
                        {(outboundData.outreach_strategy?.sequence || []).map((step, i) => (
                          <div key={i} className="relative pl-10">
                            <div className="absolute left-[-17px] top-0 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-rose-400">
                              {step.step}
                            </div>
                            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
                              <div className="flex items-center justify-between mb-2">
                                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[8px] font-black text-rose-400 uppercase">{step.channel}</span>
                                <span className="text-[9px] font-black text-slate-600 uppercase">{step.timing}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{step.goal}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Message Variants */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Message Variants</p>
                      <div className="space-y-4">
                        {(outboundData.message_variants || []).map((msg, i) => (
                          <div key={i} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/60">
                            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[8px] font-black text-slate-400 uppercase mb-3 inline-block">{msg.channel}</span>
                            <p className="text-[12px] text-slate-300 font-bold whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </section>

            {/* Feedback Footer */}
            <footer className="mt-20 pt-20 border-t border-slate-900">
               <div className="bg-slate-900/40 p-10 rounded-[40px] border border-slate-800 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-transparent"></div>
                <div className="relative">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 italic">Intelligence Feedback Loop</p>
                  <h4 className="text-2xl font-black text-white mb-2 tracking-tight">Bias the Global Knowledge Base</h4>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-2xl font-medium">
                    Your feedback is processed by Agent 1 to refine future discovery parameters. All selected and rejected states are used as training signals.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4">
                    <textarea
                      id="feedback-input"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g. Focus on technical founders with specific DevOps friction, avoid marketing agencies…"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none h-24 text-slate-300 placeholder:text-slate-700"
                    />
                    <button
                      id="btn-pass-feedback"
                      onClick={handlePassFeedback}
                      disabled={!feedback.trim() || feedbackStatus === "sending"}
                      className={`h-24 px-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 flex items-center justify-center gap-3 ${
                        feedbackStatus === "sent"
                          ? "bg-emerald-600 text-white"
                          : feedbackStatus === "error"
                          ? "bg-rose-600 text-white"
                          : feedbackStatus === "sending" || !feedback.trim()
                          ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                      }`}
                    >
                      {feedbackStatus === "sending" && <div className="w-3 h-3 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>}
                      {feedbackStatus === "sent" ? "✓ Successfully Synced" : feedbackStatus === "error" ? "✗ Sync Failed" : "Update Global Parameters"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-center mt-12 mb-8">
                <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.5em]">LeadOS · Autonomous Revenue Pipeline · 2026</p>
              </div>
            </footer>
          </div>
        ) : (
          /* Idle State */
          <div className="py-32 flex flex-col items-center text-center">
            <div className="relative mb-12">
              <div className="absolute -inset-20 bg-blue-600/10 blur-[80px] rounded-full animate-pulse"></div>
              <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center relative border border-slate-800 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
                <div className="w-8 h-8 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter italic">Pipeline Status: Standby</h2>
            <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed uppercase tracking-widest mb-12">
              The engine is ready to scout the market. Click the trigger button to begin.
            </p>
            <div className="flex gap-4">
              {["System Online", "Decision Node Ready", "LLM Synchronized"].map((label) => (
                <div key={label} className="px-5 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}