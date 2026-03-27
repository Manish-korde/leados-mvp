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
function OpportunityCard({ opp, index }) {
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
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold animate-shake">
          {opp.offerError}
        </div>
      )}

      {opp.offerData && !opp.isLoadingOffer && <OfferPanel offerData={opp.offerData} isWinner={isSelected} />}
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("idle");
  const [funnelData, setFunnelData] = useState(null);
  const [isGeneratingFunnel, setIsGeneratingFunnel] = useState(false);

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
    if (!res.ok) throw new Error("Offer Engineering Failed");
    return res.json();
  };

  const setOpp = (index, patch) => {
    setOpportunities((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  // ── Agent 1: Scan + immediately call Agent 2 for all results ───────────────
  const runAgent1 = async () => {
    setIsLoading(true);
    setError(null);
    setOpportunities([]);

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

  const isValidated = opportunities.some(o => o.validationInfo);
  const selectedCount = opportunities.filter((o) => o.validationInfo?.isSelected).length;
  const rejectedCount = opportunities.filter((o) => o.validationInfo?.decision === "NO-GO").length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-68 min-w-[260px] bg-slate-900 border-r border-slate-800/50 p-7 flex flex-col h-full shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-sky-400 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/20">L</div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white leading-none">LeadOS</h2>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">v2.0 · Decision System</p>
          </div>
        </div>

        <div className="space-y-7 flex-1 overflow-y-auto">
          {/* Pipeline */}
          <div>
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 px-1">Active Pipeline</h3>
            <nav className="space-y-1.5">
              <div className="flex items-center justify-between p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Research Node</span>
                </div>
                <span className="text-[8px] font-bold opacity-50">AGENT 1</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-600/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Offer Node</span>
                </div>
                <span className="text-[8px] font-bold opacity-50">AGENT 2</span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${opportunities.some(o => o.validationInfo) ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20" : "text-slate-700 opacity-40 border-transparent shadow-inner"}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${opportunities.some(o => o.validationInfo) ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Validation Node</span>
                </div>
                <span className="text-[8px] font-bold opacity-50">AGENT 3</span>
              </div>
            </nav>
          </div>          {/* Session Stats */}
          {opportunities.length > 0 && (
            <div>
              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 px-1">Session</h3>
              <div className="space-y-1.5">
                {[
                  { label: "Signals", val: opportunities.length, cls: "text-white" },
                  { label: "Selected", val: selectedCount, cls: "text-emerald-400" },
                  { label: "Rejected", val: rejectedCount, cls: "text-rose-400" },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="flex justify-between items-center p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/50">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
                    <span className={`text-sm font-black ${cls}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solution Type Legend */}
          <div>
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 px-1">Type Key</h3>
            <div className="space-y-1.5">
              {[
                { type: "SaaS", cls: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
                { type: "Service", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
                { type: "Platform", cls: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
              ].map(({ type, cls }) => (
                <div key={type} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cls}`}>
                  {type}
                </div>
              ))}
            </div>
          </div>

          {/* Validation Engine Trigger */}
          <div className="space-y-4 pt-4 mt-2 border-t border-slate-800/50">
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 px-1">Batch Validation</h3>
            <button
              id="btn-trigger-validation"
              onClick={runValidationAgent}
              disabled={isSelecting || opportunities.length === 0 || !opportunities.every(o => o.offerData)}
              className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 flex items-center justify-center gap-3 relative ${
                isSelecting
                  ? "bg-slate-800 text-slate-600 border-transparent animate-pulse"
                  : opportunities.length > 0 && opportunities.every(o => o.offerData)
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white hover:border-blue-400 shadow-lg shadow-blue-500/20 active:scale-95"
                  : "bg-slate-900/50 text-slate-700 border-slate-800/50 cursor-not-allowed"
              }`}
            >
              {isSelecting ? (
                <>
                  <div className="w-3 h-3 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                  Validating Batch...
                </>
              ) : (
                "GO (APPROVE BATCH)"
              )}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setOpportunities([])}
                className="py-2 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 text-[8px] font-black uppercase hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              >
                NO-GO
              </button>
              <button 
                onClick={runAgent1}
                className="py-2 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 text-[8px] font-black uppercase hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
              >
                REVISE
              </button>
            </div>
          </div>
        </div>
        {/* Operator Profile */}
        <div className="pt-6 mt-auto border-t border-slate-800/50">
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-400">MK</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-white leading-none">Manish Korde</p>
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter mt-0.5">Operator</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sky-600/4 blur-[80px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <header className="h-18 min-h-[72px] border-b border-slate-800/40 flex items-center justify-between px-10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic">Dashboard</h1>
            <div className="w-1 h-1 rounded-full bg-slate-700 mx-2"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Decision System</span>
          </div>

          <button
            id="btn-trigger-agent1"
            onClick={runAgent1}
            disabled={isLoading}
            className={`h-10 px-7 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${
              isLoading
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                : "bg-white text-slate-950 hover:scale-[1.02] active:scale-95 shadow-lg"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin"></div>
                Scanning Signals...
              </>
            ) : (
              "Trigger Signal Scout"
            )}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Error */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-4 text-rose-400">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center font-black text-base border border-rose-500/20 shrink-0">!</div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest mb-1">Signal Disruption Detected</p>
                <p className="text-xs font-bold opacity-80">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-xs font-black opacity-40 hover:opacity-100 uppercase tracking-widest shrink-0">Dismiss</button>
            </div>
          )}

          {opportunities.length > 0 ? (
            <>
              {/* Report Header */}
              <div className="border-l-4 border-blue-500 pl-6 py-1">
                <h2 className="text-3xl font-black text-white tracking-tighter italic">Intelligence Report</h2>
                <p className="text-slate-600 text-[9px] font-black mt-1 uppercase tracking-widest">
                  {opportunities.length} signals detected · {selectedCount} selected · {rejectedCount} rejected
                </p>
              </div>

              {/* Validation Result Header */}
              {opportunities.some(o => o.validationInfo) && (
                <div className={`${opportunities.some(o => o.validationInfo?.isSelected) ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} p-6 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden group mb-8`}>
                  <div className="relative z-10">
                    <p className={`text-[10px] font-black ${opportunities.some(o => o.validationInfo?.isSelected) ? 'text-emerald-500' : 'text-rose-500'} uppercase tracking-[0.4em] mb-2 drop-shadow-sm`}>Decision Gate Finalized</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter italic">
                      {opportunities.some(o => o.validationInfo?.isSelected) ? "Strong Viable Offer Identified" : "No Viable Opportunity Found"}
                    </h2>
                    <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-wide">
                      {opportunities[0]?.validationInfo?.summary || "Batch verification successfully completed."}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-6">
                      <button 
                         id="btn-trigger-agent4"
                         onClick={runFunnelAgent}
                         disabled={!opportunities.some(o => o.validationInfo?.isSelected) || isGeneratingFunnel}
                         className={`h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                           isGeneratingFunnel 
                             ? "bg-slate-800 text-slate-500 animate-pulse"
                             : opportunities.some(o => o.validationInfo?.isSelected)
                             ? "bg-emerald-500 text-slate-950 hover:bg-white shadow-xl shadow-emerald-500/20"
                             : "bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed"
                         }`}
                      >
                        {isGeneratingFunnel ? (
                          <>
                            <div className="w-3 h-3 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
                            Engineering Funnel...
                          </>
                        ) : (
                          "Move to Funnel Agent"
                        )}
                      </button>
                      <button 
                         onClick={() => setOpportunities([])}
                         className="h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 transition-all font-bold"
                      >
                        Go Back
                      </button>
                      <button 
                         onClick={runValidationAgent}
                         className="h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-amber-500 border border-amber-500/30 hover:bg-amber-500/10 transition-all font-bold"
                      >
                        Rerun Validation
                      </button>
                    </div>
                  </div>
                  <div className={`w-20 h-20 rounded-2xl ${opportunities.some(o => o.validationInfo?.isSelected) ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} border flex items-center justify-center text-4xl shadow-inner group-hover:rotate-12 transition-transform duration-500`}>
                    {opportunities.some(o => o.validationInfo?.isSelected) ? '🚀' : '❌'}
                  </div>
                </div>
              )}

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {opportunities.map((opp, idx) => (
                  <OpportunityCard key={idx} opp={opp} index={idx} />
                ))}
              </div>

              {/* Agent 4: Funnel Output */}
              <div id="funnel-output">
                <FunnelPanel funnel={funnelData} />
              </div>

              {/* Feedback */}
              <div className="bg-slate-900/40 p-7 rounded-2xl border border-slate-800 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-transparent"></div>
                <div className="relative">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1 italic">Feedback Loop</p>
                  <h4 className="text-lg font-black text-white mb-1 tracking-tight">Refine Global Intelligence</h4>
                  <p className="text-xs text-slate-600 mb-5 leading-relaxed max-w-xl">
                    Your feedback is sent with all opportunity states (selected / rejected). Agent 1 uses this to bias future signal discovery and reduce repetition.
                  </p>
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    <textarea
                      id="feedback-input"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g. Focus on B2B SaaS tools only, avoid generic services. Prioritize niches with >$500 willingness to pay…"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none h-20 text-slate-300 placeholder:text-slate-700"
                    />
                    <button
                      id="btn-pass-feedback"
                      onClick={handlePassFeedback}
                      disabled={!feedback.trim() || feedbackStatus === "sending"}
                      className={`h-10 px-5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2 ${
                        feedbackStatus === "sent"
                          ? "bg-emerald-600 text-white"
                          : feedbackStatus === "error"
                          ? "bg-rose-600 text-white"
                          : feedbackStatus === "sending" || !feedback.trim()
                          ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {feedbackStatus === "sending" && <div className="w-3 h-3 border-2 border-slate-500 border-t-blue-300 rounded-full animate-spin"></div>}
                      {feedbackStatus === "sent" ? "✓ Sent" : feedbackStatus === "error" ? "✗ Failed" : "Pass to Agent 1"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Idle */
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="relative mb-8">
                <div className="absolute -inset-8 bg-blue-600/10 blur-[40px] rounded-full"></div>
                <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center relative border border-slate-800">
                  <div className="w-7 h-7 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tighter italic">Engine Status: Idle</h2>
              <p className="text-slate-600 text-sm max-w-xs font-medium leading-relaxed uppercase tracking-widest px-4">
                Click Trigger Signal Scout to start the decision pipeline.
              </p>
              <div className="mt-10 flex gap-3">
                {["Pipeline Online", "LLM Connected"].map((label) => (
                  <div key={label} className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}