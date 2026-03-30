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
               <p className="text-2xl font-black text-white leading-tight tracking-tight italic">"{typeof funnel.hook === 'object' ? (funnel.hook?.text || funnel.hook?.hook || JSON.stringify(funnel.hook)) : funnel.hook}"</p>
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
                <p className="text-xl font-black text-white leading-tight">{typeof funnel.landing_page?.headline === 'object' ? JSON.stringify(funnel.landing_page.headline) : (funnel.landing_page?.headline || '')}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Subheadline</p>
                <p className="text-sm text-slate-400 font-bold leading-relaxed">{typeof funnel.landing_page?.subheadline === 'object' ? JSON.stringify(funnel.landing_page.subheadline) : (funnel.landing_page?.subheadline || '')}</p>
              </div>
              <div className="pt-2">
                <button className="bg-white text-slate-950 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-white/5 active:scale-95 transition-all">
                  {typeof funnel.landing_page?.cta === 'object' ? (funnel.landing_page.cta?.text || funnel.landing_page.cta?.label || 'Get Started') : (funnel.landing_page?.cta || 'Get Started')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Lead Magnet</h4>
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4 group hover:border-amber-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎁</div>
                <p className="text-xs font-black text-slate-200 leading-snug">{typeof funnel.lead_magnet === 'object' ? (funnel.lead_magnet?.title || funnel.lead_magnet?.name || JSON.stringify(funnel.lead_magnet)) : (funnel.lead_magnet || '')}</p>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Acquisition Channels</h4>
              <div className="flex flex-wrap gap-2">
                {funnel.acquisition_channels.map((chan, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-wider">{typeof chan === 'object' ? (chan?.name || chan?.channel || JSON.stringify(chan)) : String(chan)}</span>
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
                   <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
                     {typeof step === 'object' ? (
                       <>
                         <p className="text-xs font-bold text-slate-300 leading-relaxed">{step.task || step.action || step.description || JSON.stringify(step)}</p>
                         {step.status && <span className="mt-1 inline-block px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-400 uppercase">{step.status}</span>}
                       </>
                     ) : (
                       <p className="text-xs font-bold text-slate-300 leading-relaxed">{String(step)}</p>
                     )}
                   </div>
                </div>
              ))}
            </div>

            {/* Calendly Booking Link */}
            {funnel.booking_link && (
              <div className="mt-8 bg-purple-500/10 border border-purple-500/20 p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm">📅</div>
                  <div>
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{funnel.booking_link_type || 'Discovery Call'}</span>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">via Calendly</p>
                  </div>
                </div>
                <a href={funnel.booking_link} target="_blank" rel="noopener noreferrer"
                   className="block w-full px-4 py-3 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-400 text-[10px] font-black uppercase tracking-wider hover:bg-purple-500/30 transition-colors text-center">
                  Book {funnel.booking_link_type || 'Discovery Call'}
                </a>
              </div>
            )}

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
  const [captureData, setCaptureData] = useState(null);
  const [isGeneratingCapture, setIsGeneratingCapture] = useState(false);
  const [qualificationData, setQualificationData] = useState(null);
  const [isGeneratingQualification, setIsGeneratingQualification] = useState(false);
  const [routingData, setRoutingData] = useState(null);
  const [isGeneratingRouting, setIsGeneratingRouting] = useState(false);
  const [attributionData, setAttributionData] = useState(null);
  const [isGeneratingAttribution, setIsGeneratingAttribution] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [isGeneratingPerformance, setIsGeneratingPerformance] = useState(false);
  const [hygieneData, setHygieneData] = useState(null);
  const [isGeneratingHygiene, setIsGeneratingHygiene] = useState(false);

  const runPerformanceAgent = async () => {
    setIsGeneratingPerformance(true);
    setError(null);
    try {
      const res = await fetch('/webhook/agent12-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traffic_data: trafficData,
          capture_data: captureData,
          routing_data: routingData,
          attribution_data: attributionData
        }),
      });
      if (!res.ok) throw new Error('Agent 12 failed');
      const data = await res.json();
      setPerformanceData(data.performance_report || data);
    } catch (err) {
      setError('Performance Agent: ' + err.message);
    } finally {
      setIsGeneratingPerformance(false);
    }
  };

  const runHygieneAgent = async () => {
    setIsGeneratingHygiene(true);
    setError(null);
    try {
      const res = await fetch('/webhook/agent13-crm-hygiene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capture_data: captureData,
          qualification_data: qualificationData,
          routing_data: routingData,
          attribution_data: attributionData
        }),
      });
      if (!res.ok) throw new Error('Agent 13 failed');
      const data = await res.json();
      setHygieneData(data.hygiene_report || data);
    } catch (err) {
      setError('CRM Hygiene Agent: ' + err.message);
    } finally {
      setIsGeneratingHygiene(false);
    }
  };

  const runAttributionAgent = async () => {
    if (!routingData) return;
    const winner = opportunities.find(o => o.validationInfo?.isSelected);
    if (!winner) return;
    setIsGeneratingAttribution(true);
    setError(null);
    setAttributionData(null);
    const pt = trafficData?.paid_traffic || trafficData;
    const payload = {
      routed_leads: routingData.routed_leads || [],
      capture_data: {
        traffic: captureData?.traffic || {},
        leads_summary: captureData?.leads_summary || {},
        conversion: captureData?.conversion || {},
      },
      traffic_data: {
        channels: pt?.channels || [],
        totals: pt?.totals || {},
        total_daily_budget: pt?.total_daily_budget,
      },
      offer_context: {
        offer: winner.offerData?.offer || winner.solution,
        pricing: winner.offerData?.pricing,
        promise: winner.offerData?.promise,
        ICP: winner.offerData?.ICP || winner.offerData?.icp || winner.audience,
      },
    };
    try {
      const res = await fetch('/webhook/agent11-tracking-attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error('Attribution Agent Failed: ' + text.substring(0, 100));
      if (!text || text.trim() === '' || text.trim() === 'null') throw new Error('Empty response from Attribution Agent. Check n8n is active.');
      let result;
      try { result = JSON.parse(text); } catch { throw new Error('Attribution Agent returned malformed data. Retry.'); }
      if (result.error) throw new Error(result.error);
      setAttributionData(result);
      setTimeout(() => { document.getElementById('attribution-output')?.scrollIntoView({ behavior: 'smooth' }); }, 500);
    } catch (err) {
      setError('Attribution Failure: ' + err.message);
    } finally {
      setIsGeneratingAttribution(false);
    }
  };

  const runRoutingAgent = async () => {
    if (!qualificationData) return;
    const winner = opportunities.find(o => o.validationInfo?.isSelected);
    if (!winner) return;
    setIsGeneratingRouting(true);
    setError(null);
    setRoutingData(null);
    const payload = {
      qualified_leads: (qualificationData.qualified_leads || []).map(lead => ({
        lead_id: lead.lead_id,
        name: lead.name,
        company: lead.company,
        bant_score: lead.bant_score,
        classification: lead.classification,
        responses: lead.responses,
        final_status: lead.final_status,
        routing: lead.routing,
        call_script: lead.call_script,
      })),
      offer_context: {
        offer: winner.offerData?.offer || winner.solution,
        pricing: winner.offerData?.pricing,
        promise: winner.offerData?.promise,
      },
      behavioural_signals: {},
    };
    try {
      const res = await fetch('/webhook/agent10-sales-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error('Routing Agent Failed: ' + text.substring(0, 100));
      if (!text || text.trim() === '' || text.trim() === 'null') throw new Error('Empty response from Routing Agent.');
      let result;
      try { result = JSON.parse(text); } catch { throw new Error('Routing Agent returned malformed data. Retry.'); }
      if (result.error) throw new Error(result.error);
      setRoutingData(result);
      setTimeout(() => { document.getElementById('routing-output')?.scrollIntoView({ behavior: 'smooth' }); }, 500);
    } catch (err) {
      setError('Routing Failure: ' + err.message);
    } finally {
      setIsGeneratingRouting(false);
    }
  };

  const runQualificationAgent = async () => {
    if (!captureData) return;
    const winner = opportunities.find(o => o.validationInfo?.isSelected);
    if (!winner) return;

    setIsGeneratingQualification(true);
    setError(null);
    setQualificationData(null);

    const leads = captureData.leads || [];
    const payload = {
      leads: leads.map(l => ({
        lead_id: l.lead_id || `lead-${Math.random().toString(36).slice(2,7)}`,
        name: l.name,
        company: l.company,
        role: l.role,
        source: l.source,
        pain_level: l.pain_level,
        intent_level: l.intent_level,
        budget_level: l.budget_level,
        ICP_match: l.ICP_match,
        lead_score: l.lead_score,
      })),
      offer_context: {
        offer: winner.offerData?.offer || winner.solution,
        ICP: winner.offerData?.ICP || winner.offerData?.icp || winner.audience,
        pricing: winner.offerData?.pricing,
        promise: winner.offerData?.promise,
      },
      funnel_context: funnelData,
    };

    try {
      const res = await fetch('/webhook/agent9-qualification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error('Qualification Agent Failed: ' + text.substring(0, 100));
      if (!text || text.trim() === '' || text.trim() === 'null') {
        throw new Error('Empty response from Qualification Agent. Check n8n is active and try again.');
      }
      let result;
      try { result = JSON.parse(text); }
      catch { throw new Error('Qualification Agent returned malformed data. Retry.'); }
      if (result.error) throw new Error(result.error);
      setQualificationData(result);
      setTimeout(() => {
        document.getElementById('qualification-output')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err) {
      setError('Qualification Failure: ' + err.message);
    } finally {
      setIsGeneratingQualification(false);
    }
  };

  const runCaptureAgent = async () => {
    if (!outboundData || !trafficData) return;
    const winner = opportunities.find(o => o.validationInfo?.isSelected);
    if (!winner) return;

    setIsGeneratingCapture(true);
    setError(null);
    setCaptureData(null);

    const payload = {
      offer: {
        ICP: winner.offerData?.ICP || winner.offerData?.icp || winner.audience,
        offer: winner.offerData?.offer || winner.solution,
        pricing: winner.offerData?.pricing,
        promise: winner.offerData?.promise,
      },
      funnel: funnelData,
      content_assets: narrativeData,
      paid_traffic: trafficData?.paid_traffic || trafficData,
      outbound_outreach: outboundData?.outbound_outreach || outboundData,
    };

    try {
      const res = await fetch("/webhook/agent8-inbound-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error("Capture Agent Failed: " + text.substring(0, 100));
      if (!text || text.trim() === "" || text.trim() === "null") {
        throw new Error("Empty response from Capture Agent. Check n8n is active and try again.");
      }
      let result;
      try { result = JSON.parse(text); }
      catch { throw new Error("Capture Agent returned malformed data. Retry."); }
      if (result.error) throw new Error(result.error);
      setCaptureData(result);
      setTimeout(() => {
        document.getElementById('capture-output')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err) {
      setError("Inbound Capture Failure: " + err.message);
    } finally {
      setIsGeneratingCapture(false);
    }
  };

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
      const funnel = result.funnel || result;
      if (result.booking_link) funnel.booking_link = result.booking_link;
      if (result.booking_link_type) funnel.booking_link_type = result.booking_link_type;
      setFunnelData(funnel);
      
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
    setOutboundData(null);
    setCaptureData(null);
    setQualificationData(null);
    setRoutingData(null);
    setAttributionData(null); // RESET FULL PIPELINE
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
                     <p className="text-3xl font-black text-white italic tracking-tighter leading-tight italic">"{typeof narrativeData.core_message === 'object' ? (narrativeData.core_message?.text || narrativeData.core_message?.message || JSON.stringify(narrativeData.core_message)) : (narrativeData.core_message || '')}"</p>
                  </div>

                  {/* Messaging Angles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {narrativeData.angles.map((angle, idx) => (
                      <div key={idx} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${angle.type === 'pain' ? 'bg-rose-500' : angle.type === 'outcome' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                           Angle: {angle.type}
                        </p>
                         <p className="text-[13px] text-slate-400 font-bold leading-relaxed">{typeof angle.message === 'object' ? (angle.message?.text || JSON.stringify(angle.message)) : (angle.message || '')}</p>
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
                            <p className="text-[13px] text-slate-400 font-bold whitespace-pre-wrap leading-relaxed">{typeof narrativeData.assets?.linkedin_post === 'object' ? JSON.stringify(narrativeData.assets.linkedin_post) : (narrativeData.assets?.linkedin_post || '')}</p>
                        </div>
                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                           <header className="flex justify-between items-center mb-6">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cold DM / Direct Angle</span>
                              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded">Ready</span>
                           </header>
                            <p className="text-[13px] text-slate-400 font-bold whitespace-pre-wrap leading-relaxed">{typeof narrativeData.assets?.cold_dm === 'object' ? JSON.stringify(narrativeData.assets.cold_dm) : (narrativeData.assets?.cold_dm || '')}</p>
                        </div>
                     </div>
                     <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col">
                        <header className="flex justify-between items-center mb-6">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Sequence Asset</span>
                           <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase rounded">Ready</span>
                        </header>
                         <p className="text-[13px] text-slate-400 font-bold whitespace-pre-wrap leading-relaxed flex-1">{typeof narrativeData.assets?.email === 'object' ? JSON.stringify(narrativeData.assets.email) : (narrativeData.assets?.email || '')}</p>
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
                  {/* Summary Stats */}
                  {(() => {
                    const pt = trafficData?.paid_traffic || trafficData;
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 bg-gradient-to-br from-violet-600/10 to-purple-500/5 border border-violet-500/20 rounded-3xl p-8">
                            <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-4">Paid Performance Summary</p>
                            <div className="flex flex-wrap gap-8 items-end">
                              <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Daily Budget</p>
                                <p className="text-4xl font-black text-white">${pt?.total_daily_budget}<span className="text-lg text-slate-500">/day</span></p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Clicks</p>
                                <p className="text-4xl font-black text-sky-400">{pt?.totals?.total_clicks}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Blended CPL</p>
                                <p className="text-4xl font-black text-violet-400">${pt?.totals?.blended_cpl}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Leads</p>
                                <p className="text-4xl font-black text-emerald-400">{pt?.totals?.total_leads}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center gap-3">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Formula Verification</p>
                            <p className="text-[11px] text-slate-500 font-bold">clicks = budget ÷ cpc</p>
                            <p className="text-[11px] text-slate-500 font-bold">leads = clicks × cvr%</p>
                            <p className="text-[11px] text-slate-500 font-bold">cpl = total_budget ÷ total_leads</p>
                          </div>
                        </div>

                        {/* Channel Cards */}
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Channel Breakdown</p>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {(pt?.channels || []).map((ch, i) => (
                              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-7 space-y-5 hover:border-violet-500/30 transition-all">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-lg">
                                      {(ch.name||'').toLowerCase().includes('linkedin') ? '💼' :
                                       (ch.name||'').toLowerCase().includes('google') ? '🔍' :
                                       (ch.name||'').toLowerCase().includes('meta') || (ch.name||'').toLowerCase().includes('facebook') ? '📘' : '📣'}
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-white">{ch.name}</h4>
                                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{ch.allocation_percentage}% of budget</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-600 uppercase">Daily Budget</p>
                                    <p className="text-lg font-black text-white">${ch.daily_budget}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-5 gap-2">
                                  {[
                                    { label: 'CPC', value: `$${ch.cpc}` },
                                    { label: 'CTR', value: `${ch.ctr}%` },
                                    { label: 'CVR', value: `${ch.conversion_rate}%` },
                                    { label: 'Clicks', value: ch.expected_clicks },
                                    { label: 'Leads', value: ch.expected_leads },
                                  ].map(m => (
                                    <div key={m.label} className="bg-slate-950/80 rounded-xl p-2.5 text-center border border-slate-800/60">
                                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{m.label}</p>
                                      <p className="text-sm font-black text-white">{m.value}</p>
                                    </div>
                                  ))}
                                </div>

                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
                                  <p className="text-[9px] font-black text-emerald-500 uppercase">Expected Leads / Day</p>
                                  <p className="text-xl font-black text-white">{ch.expected_leads}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
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
                  {(() => {
                    const ob = outboundData?.outbound_outreach || outboundData;
                    return (
                      <>
                        {/* KPI Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Daily Contacts', value: ob?.daily_contacts, color: 'text-white', bg: 'bg-slate-900/80 border-slate-800' },
                            { label: 'Response Rate', value: `${ob?.response_rate}%`, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
                            { label: 'Positive Reply Rate', value: `${ob?.positive_reply_rate}%`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                            { label: 'Meetings / Day', value: ob?.meetings_booked_per_day, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                          ].map((stat, i) => (
                            <div key={i} className={`${stat.bg} border rounded-2xl p-6 text-center`}>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Math trace */}
                        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-6 py-4 flex flex-wrap gap-6">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Derived</p>
                          <p className="text-[11px] text-slate-500 font-bold">responses/day = {ob?.daily_contacts} × {ob?.response_rate}% = <span className="text-white">{Math.round((ob?.daily_contacts||0) * (ob?.response_rate||0) / 100)}</span></p>
                          <p className="text-[11px] text-slate-500 font-bold">meetings/day = {Math.round((ob?.daily_contacts||0) * (ob?.response_rate||0) / 100)} × {ob?.positive_reply_rate}% = <span className="text-emerald-400">{ob?.meetings_booked_per_day}</span></p>
                        </div>

                        {/* Channels + Targeting */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5">ICP Targeting</p>
                            <p className="text-sm font-black text-white mb-4">{ob?.targeting?.persona}</p>
                            <div className="space-y-3">
                              <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase mb-2">Industry</p>
                                <div className="flex flex-wrap gap-1.5">{(ob?.targeting?.company_criteria?.industry||[]).map((ind,i) => <span key={i} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-black text-slate-400 uppercase">{ind}</span>)}</div>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase mb-2">Company Size</p>
                                <p className="text-xs font-black text-slate-300">{ob?.targeting?.company_criteria?.company_size}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase mb-2">Trigger Signals</p>
                                <div className="flex flex-wrap gap-2">{(ob?.targeting?.company_criteria?.signals||[]).map((sig,i) => <span key={i} className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] font-black text-amber-400">⚡ {sig}</span>)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5">Outreach Sequence</p>
                            <div className="space-y-4 relative border-l border-slate-800/80 ml-3">
                              {(ob?.sequence||[]).map((step, i) => (
                                <div key={i} className="relative pl-8">
                                  <div className="absolute left-[-15px] top-0 w-7 h-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[9px] font-black text-rose-400">{step.step}</div>
                                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[8px] font-black text-rose-400 uppercase">{step.channel}</span>
                                      <span className="text-[9px] font-black text-slate-600">{step.timing}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{step.goal}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Prospects + Messages */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Simulated Prospects</p>
                            <div className="space-y-3">
                              {(ob?.prospect_simulation||[]).map((p, i) => (
                                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 hover:border-rose-500/20 transition-all flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-sm shrink-0">{p.name?.charAt(0)||'?'}</div>
                                  <div>
                                    <p className="text-sm font-black text-white">{p.name}</p>
                                    <p className="text-[9px] font-black text-rose-400 uppercase">{p.role} · {p.company}</p>
                                    <p className="text-[11px] text-slate-500 font-bold mt-1 leading-relaxed">{p.reason_fit}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Message Variants</p>
                            <div className="space-y-3">
                              {(ob?.message_variants||[]).map((msg, i) => (
                                <div key={i} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
                                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[8px] font-black text-slate-400 uppercase mb-2 inline-block">{msg.channel}</span>
                                  <p className="text-[11px] text-slate-300 font-bold whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </section>

            <Connector />

            {/* ── Step 8: Inbound Lead Capture ── */}
            <section id="step-8" className={`${captureData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader
                num="08"
                title="Inbound Lead Capture"
                subtitle="Traffic Conversion & Lead Object Generation"
                status={captureData ? "Leads Captured" : (outboundData ? "Awaiting Activation" : "Dormant")}
              />

              {!captureData ? (
                <div className="py-20 flex flex-col items-center">
                  <button
                    onClick={runCaptureAgent}
                    disabled={isGeneratingCapture || !outboundData}
                    className={`h-16 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 ${
                      isGeneratingCapture
                        ? "bg-slate-800 text-slate-500 animate-pulse"
                        : outboundData
                          ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-600/30 scale-105"
                          : "bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    {isGeneratingCapture ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-emerald-400 rounded-full animate-spin"></div>
                        Simulating Lead Capture...
                      </>
                    ) : (
                      "SIMULATE INBOUND CAPTURE"
                    )}
                  </button>
                  {!outboundData && <p className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Complete Step 7 Outbound to unlock lead capture layer.</p>}
                </div>
              ) : (
                <div id="capture-output" className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
                  {/* Visitor Derivation + Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Visitors', value: captureData.traffic?.total_visitors?.toLocaleString(), color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                      { label: 'Total Leads', value: captureData.leads_summary?.total, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                      { label: 'High Intent', value: captureData.leads_summary?.high_intent, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                      { label: 'Avg Conversion', value: captureData.conversion?.average, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.bg} border rounded-2xl p-6 text-center`}>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                        <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Traffic Source Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-5">Visitor Source Derivation</p>
                      <div className="space-y-4">
                        {[['paid', 'violet', captureData.traffic?.paid_visitors, captureData.conversion?.paid], ['outbound', 'rose', captureData.traffic?.outbound_visitors, captureData.conversion?.outbound], ['organic', 'sky', captureData.traffic?.organic_visitors, captureData.conversion?.organic]].map(([src, color, vis, cvr], i) => {
                          const total = captureData.traffic?.total_visitors || 1;
                          const pct = Math.round(((vis||0) / total) * 100);
                          const colorMap = { violet: 'bg-violet-500', rose: 'bg-rose-500', sky: 'bg-sky-500' };
                          const textMap = { violet: 'text-violet-400', rose: 'text-rose-400', sky: 'text-sky-400' };
                          return (
                            <div key={i}>
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">{src}</span>
                                <span className="text-[10px] font-black text-white">{(vis||0).toLocaleString()} <span className="text-slate-600">visitors</span> → <span className={textMap[color]}>{cvr} CVR</span></span>
                              </div>
                              <div className="w-full bg-slate-800/50 rounded-full h-1.5">
                                <div className={`${colorMap[color]} h-full rounded-full`} style={{width:`${pct}%`}}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-5">Lead Source Split</p>
                      <div className="space-y-4">
                        {[['Paid', captureData.leads_summary?.paid,'text-violet-400'], ['Outbound', captureData.leads_summary?.outbound,'text-rose-400'], ['Organic', captureData.leads_summary?.organic,'text-sky-400']].map(([label, count, cls], i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-900/60 border border-slate-800/50 rounded-xl px-4 py-3">
                            <p className={`text-[10px] font-black uppercase ${cls}`}>{label} Leads</p>
                            <p className="text-lg font-black text-white">{count}</p>
                          </div>
                        ))}
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                          <p className="text-[10px] font-black uppercase text-emerald-400">Total</p>
                          <p className="text-lg font-black text-white">{captureData.leads_summary?.total}</p>
                        </div>
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{captureData.calculation?.formula}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lead Table with Scoring */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5">Captured Lead Objects</p>
                    <div className="space-y-3">
                      {(captureData.leads || []).map((lead, i) => {
                        const intentColor = lead.intent_level === 'hot' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : lead.intent_level === 'warm' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-slate-400 bg-slate-800 border-slate-700';
                        const scoreColor = (lead.lead_score||0) >= 7 ? 'text-emerald-400' : (lead.lead_score||0) >= 5 ? 'text-amber-400' : 'text-rose-400';
                        const srcColor = lead.source === 'paid' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' : lead.source === 'outbound' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-sky-400 bg-sky-500/10 border-sky-500/20';
                        return (
                          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 hover:border-emerald-500/20 transition-all">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-sm shrink-0">{lead.name?.charAt(0)||'?'}</div>
                              <div className="flex-1 min-w-[140px]">
                                <p className="text-sm font-black text-white leading-tight">{lead.name}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase">{lead.role} · {lead.company}</p>
                              </div>
                              <p className="text-[10px] font-black text-slate-600 hidden lg:block">{lead.email}</p>
                              <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
                                <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${srcColor}`}>{lead.source}</span>
                                <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${intentColor}`}>{lead.intent_level}</span>
                                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-black text-slate-400 uppercase">ICP: {lead.ICP_match}</span>
                                <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1">
                                  <span className="text-[7px] font-black text-slate-600 uppercase">Score</span>
                                  <span className={`text-base font-black ${scoreColor}`}>{lead.lead_score}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <Connector />

            {/* ── Step 9: AI Qualification Simulator ── */}
            <section id="step-9" className={`${qualificationData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader
                num="09"
                title="AI Qualification Simulator"
                subtitle="BANT Call Simulation · Lead Routing · Conversion Readiness"
                status={qualificationData ? `${qualificationData.summary?.hot || 0} HOT leads identified` : (captureData ? 'Awaiting Activation' : 'Dormant')}
              />

              {!qualificationData ? (
                <div className="py-20 flex flex-col items-center">
                  <button
                    onClick={runQualificationAgent}
                    disabled={isGeneratingQualification || !captureData}
                    className={`h-16 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 ${
                      isGeneratingQualification
                        ? 'bg-slate-800 text-slate-500 animate-pulse'
                        : captureData
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xl shadow-amber-500/30 scale-105'
                          : 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {isGeneratingQualification ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin"></div>
                        Simulating Qualification Calls...
                      </>
                    ) : (
                      'RUN AI QUALIFICATION'
                    )}
                  </button>
                  {!captureData && <p className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Complete Step 8 Lead Capture to unlock qualification layer.</p>}
                </div>
              ) : (
                <div id="qualification-output" className="space-y-10 animate-in fade-in zoom-in-95 duration-700">

                  {/* Summary Distribution */}
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-3xl p-8">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-6">BANT Qualification Summary</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { label: 'Total', value: qualificationData.summary?.total_leads, color: 'text-white', bg: 'bg-slate-800/80 border-slate-700' },
                        { label: '🔥 HOT', value: qualificationData.summary?.hot, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
                        { label: '🌤 WARM', value: qualificationData.summary?.warm, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
                        { label: '⚡ MEDIUM', value: qualificationData.summary?.medium, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
                        { label: '❄ COLD', value: qualificationData.summary?.cold, color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' },
                      ].map((s, i) => (
                        <div key={i} className={`${s.bg} border rounded-2xl p-5 text-center`}>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                          <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lead Qualification Cards */}
                  <div className="space-y-6">
                    {(qualificationData.qualified_leads || []).map((lead, i) => {
                      const statusColor = lead.final_status === 'HOT' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                        lead.final_status === 'WARM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                        lead.final_status === 'MEDIUM' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
                        'text-slate-500 bg-slate-800/50 border-slate-700';
                      const routeColor = lead.routing === 'checkout' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                        lead.routing === 'sales_call' ? 'text-sky-400 bg-sky-500/10 border-sky-500/30' :
                        lead.routing === 'nurture' ? 'text-violet-400 bg-violet-500/10 border-violet-500/30' :
                        'text-slate-500 bg-slate-800 border-slate-700';
                      const routeIcon = lead.routing === 'checkout' ? '💳' : lead.routing === 'sales_call' ? '📞' : lead.routing === 'nurture' ? '🌱' : '🗑';
                      const total = lead.bant_score?.total || 0;
                      const totalPct = Math.round((total / 100) * 100);
                      const scoreBarColor = total >= 80 ? 'bg-rose-500' : total >= 60 ? 'bg-amber-500' : total >= 40 ? 'bg-yellow-500' : 'bg-slate-600';

                      return (
                        <div key={i} className={`bg-slate-900/60 border rounded-3xl p-7 transition-all hover:shadow-xl ${
                          lead.final_status === 'HOT' ? 'border-rose-500/30 hover:border-rose-500/50' :
                          lead.final_status === 'WARM' ? 'border-amber-500/20 hover:border-amber-500/40' :
                          'border-slate-800 hover:border-slate-700'
                        }`}>

                          {/* Lead Header */}
                          <div className="flex flex-wrap items-start gap-4 mb-6">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-sm shrink-0">
                              {lead.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-[150px]">
                              <p className="text-base font-black text-white leading-tight">{lead.name}</p>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{lead.company}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-3 py-1 rounded-xl border text-[9px] font-black uppercase ${statusColor}`}>{lead.final_status}</span>
                              <span className={`px-3 py-1 rounded-xl border text-[9px] font-black uppercase flex items-center gap-1 ${routeColor}`}>{routeIcon} {lead.routing}</span>
                            </div>
                          </div>

                          {/* BANT Score Bar */}
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">BANT Score</span>
                              <span className="text-2xl font-black text-white">{total}<span className="text-slate-600 text-sm">/100</span></span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                              <div className={`${scoreBarColor} h-full rounded-full transition-all duration-1000`} style={{width: `${totalPct}%`}}></div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-3">
                              {['budget','authority','need','timeline'].map(dim => {
                                const score = lead.bant_score?.[dim] || 0;
                                const cls = lead.classification?.[dim];
                                const dimColor = cls === 'positive' ? 'text-emerald-400' : cls === 'neutral' ? 'text-amber-400' : 'text-slate-500';
                                return (
                                  <div key={dim} className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-2 text-center">
                                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">{dim}</p>
                                    <p className={`text-base font-black ${dimColor}`}>{score}</p>
                                    <p className={`text-[7px] font-black uppercase ${dimColor}`}>{cls}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Call Script */}
                          <div className="bg-slate-950/80 border border-slate-800/50 rounded-2xl p-5 mb-4">
                            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">📞 Simulated Call Script</p>
                            <p className="text-[12px] text-slate-300 font-bold leading-relaxed italic">"{lead.call_script}"</p>
                          </div>

                          {/* BANT Responses */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['budget','authority','need','timeline'].map(dim => {
                              const cls = lead.classification?.[dim];
                              const resp = lead.responses?.[dim];
                              const borderColor = cls === 'positive' ? 'border-emerald-500/20' : cls === 'neutral' ? 'border-amber-500/20' : 'border-slate-800';
                              const labelColor = cls === 'positive' ? 'text-emerald-400' : cls === 'neutral' ? 'text-amber-400' : 'text-slate-500';
                              const icon = cls === 'positive' ? '✓' : cls === 'neutral' ? '~' : '✗';
                              return (
                                <div key={dim} className={`bg-slate-900/40 border ${borderColor} rounded-xl p-4`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs font-black ${labelColor}`}>{icon}</span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{dim}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{resp}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </section>

            <Connector />

            {/* Step 10: Sales Routing Engine */}
            <section id="step-10" className={`${routingData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader
                num="10"
                title="Sales Routing Engine"
                subtitle="Deterministic Intent Scoring · CRM Stage Assignment · Pipeline Dispatch"
                status={routingData ? `${routingData.pipeline_summary?.checkout || 0} Checkout · ${routingData.pipeline_summary?.sales_call || 0} Sales Call` : (qualificationData ? 'Awaiting Activation' : 'Dormant')}
              />

              {!routingData ? (
                <div className="py-20 flex flex-col items-center">
                  <button
                    onClick={runRoutingAgent}
                    disabled={isGeneratingRouting || !qualificationData}
                    className={`h-16 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 ${
                      isGeneratingRouting
                        ? 'bg-slate-800 text-slate-500 animate-pulse'
                        : qualificationData
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-xl shadow-emerald-500/30 scale-105'
                          : 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {isGeneratingRouting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin"></div>
                        Computing Routing Decisions...
                      </>
                    ) : 'EXECUTE SALES ROUTING'}
                  </button>
                  {!qualificationData && <p className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Complete Step 9 to unlock routing engine.</p>}
                </div>
              ) : (
                <div id="routing-output" className="space-y-10 animate-in fade-in zoom-in-95 duration-700">

                  {/* Pipeline Board */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-8">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-6">Pipeline Distribution</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Checkout', key: 'checkout', icon: '💳', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                          { label: 'Sales Call', key: 'sales_call', icon: '📞', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
                          { label: 'Nurture', key: 'nurture', icon: '🌱', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
                          { label: 'Disqualified', key: 'disqualified', icon: '🗑', color: 'text-slate-500', bg: 'bg-slate-800/80 border-slate-700' },
                        ].map((bucket, i) => (
                          <div key={i} className={`${bucket.bg} border rounded-2xl p-4 flex items-center gap-3`}>
                            <span className="text-2xl">{bucket.icon}</span>
                            <div>
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{bucket.label}</p>
                              <p className={`text-3xl font-black ${bucket.color}`}>{routingData.pipeline_summary?.[bucket.key] || 0}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 space-y-5">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Intent Score</p>
                        <p className="text-5xl font-black text-white">{routingData.pipeline_summary?.total_intent_score_avg || '–'}<span className="text-slate-600 text-xl">/100</span></p>
                        {(() => {
                          const avg = routingData.pipeline_summary?.total_intent_score_avg || 0;
                          const pct = Math.min(avg, 100);
                          const col = avg >= 75 ? 'bg-emerald-500' : avg >= 55 ? 'bg-amber-500' : avg >= 35 ? 'bg-yellow-500' : 'bg-slate-600';
                          return <div className="w-full bg-slate-800 rounded-full h-2 mt-3"><div className={`${col} h-full rounded-full`} style={{width:`${pct}%`}}></div></div>;
                        })()}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Active Flags</p>
                        <div className="flex flex-wrap gap-2">
                          {(routingData.pipeline_summary?.flags_triggered || []).length === 0
                            ? <span className="text-[10px] font-black text-slate-700 uppercase">None</span>
                            : (routingData.pipeline_summary?.flags_triggered || []).map((flag, i) => (
                              <span key={i} className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[8px] font-black text-amber-400 uppercase">{flag}</span>
                            ))}
                        </div>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Total Processed</span>
                        <span className="text-xl font-black text-white">{routingData.pipeline_summary?.total || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Formula Bar */}
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Formula</p>
                    <p className="text-[11px] font-black text-slate-500">intent = <span className="text-white">(bant × 0.5)</span> + <span className="text-sky-400">(behaviour × 0.3)</span> + <span className="text-violet-400">(transcript × 0.2)</span></p>
                    <p className="text-[9px] font-black text-slate-700 uppercase">≥75→Checkout · ≥60→Sales Call · ≥35→Nurture · &lt;35→Disqualify</p>
                  </div>

                  {/* Routed Lead Cards */}
                  <div className="space-y-5">
                    {(routingData.routed_leads || []).map((lead, i) => {
                      const D = {
                        CHECKOUT: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: '💳', bar: 'bg-emerald-500', border: 'border-emerald-500/20 hover:border-emerald-500/50' },
                        SALES_CALL: { color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30', icon: '📞', bar: 'bg-sky-500', border: 'border-sky-500/20 hover:border-sky-500/40' },
                        NURTURE: { color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30', icon: '🌱', bar: 'bg-violet-500', border: 'border-violet-500/20 hover:border-violet-500/40' },
                        DISQUALIFIED: { color: 'text-slate-500', bg: 'bg-slate-800/50 border-slate-700', icon: '🗑', bar: 'bg-slate-600', border: 'border-slate-800 hover:border-slate-700' },
                      };
                      const cfg = D[lead.final_decision] || D.DISQUALIFIED;
                      const intentPct = Math.min(Math.round(lead.intent_score || 0), 100);
                      const qualPct = Math.min(Math.round(lead.qualification_score || 0), 100);
                      return (
                        <div key={i} className={`bg-slate-900/60 border rounded-3xl p-7 transition-all ${cfg.border}`}>
                          <div className="flex flex-wrap items-start gap-4 mb-6">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-sm shrink-0">{lead.name?.charAt(0)||'?'}</div>
                            <div className="flex-1 min-w-[150px]">
                              <p className="text-base font-black text-white">{lead.name}</p>
                              <p className="text-[9px] font-black text-slate-500 uppercase">{lead.company}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap ml-auto">
                              <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase flex items-center gap-1.5 ${cfg.bg} ${cfg.color}`}>{cfg.icon} {lead.final_decision?.replace('_', ' ')}</span>
                              <span className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-[9px] font-black text-slate-400 uppercase">{lead.crm_stage}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            {[['BANT Score', lead.qualification_score, qualPct],['Intent Score', Math.round(lead.intent_score||0), intentPct]].map(([lbl,val,pct],j)=>(
                              <div key={j}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{lbl}</span>
                                  <span className="text-sm font-black text-white">{val}<span className="text-slate-600">/100</span></span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                  <div className={`${cfg.bar} h-full rounded-full ${j===1?'opacity-70':''}`} style={{width:`${pct}%`}}></div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-5">
                            {[['Qual',lead.qualification_score],['Behaviour',lead.behaviour_score],['Transcript',lead.transcript_intent],['Intent',Math.round(lead.intent_score||0)]].map(([lbl,val],j)=>(
                              <div key={j} className="bg-slate-950/80 border border-slate-800/60 rounded-xl px-3 py-2 text-center">
                                <p className="text-[7px] font-black text-slate-600 uppercase mb-0.5">{lbl}</p>
                                <p className="text-sm font-black text-white">{val}</p>
                              </div>
                            ))}
                          </div>

                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-2xl p-5 space-y-4">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Routing Reasoning</p>
                            <div className="grid grid-cols-2 gap-3">
                              {['budget','authority','need','timeline'].map(dim => (
                                <div key={dim}>
                                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{dim}</p>
                                  <p className="text-[11px] text-slate-400 font-bold leading-snug">{lead.reasoning?.[dim] || '–'}</p>
                                </div>
                              ))}
                            </div>
                            {lead.reasoning?.behaviour_signals && (
                              <div className="pt-3 border-t border-slate-800/60">
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Behaviour Signals</p>
                                <p className="text-[11px] text-slate-400 font-bold">{lead.reasoning.behaviour_signals}</p>
                              </div>
                            )}
                            {lead.reasoning?.transcript_summary && (
                              <div className="pt-3 border-t border-slate-800/60">
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Transcript Signal</p>
                                <p className="text-[11px] text-slate-300 font-bold italic">"{lead.reasoning.transcript_summary}"</p>
                              </div>
                            )}
                          </div>

                          {lead.flags?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {lead.flags.map((flag, fi) => (
                                <span key={fi} className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[8px] font-black text-amber-400 uppercase">⚑ {flag}</span>
                              ))}
                            </div>
                          )}

                          {/* Calendly Booking Link */}
                          {lead.calendly_link && (lead.final_decision === 'SALES_CALL' || lead.final_decision === 'CHECKOUT') && (
                            <div className="mt-5 pt-4 border-t border-slate-800/50">
                              <a href={lead.calendly_link} target="_blank" rel="noopener noreferrer"
                                 className={`block w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors text-center ${
                                   lead.final_decision === 'CHECKOUT'
                                     ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                                     : 'bg-sky-500/20 border border-sky-500/40 text-sky-400 hover:bg-sky-500/30'
                                 }`}>
                                📅 {lead.final_decision === 'CHECKOUT' ? 'Schedule Enterprise Discussion' : 'Schedule Sales Call'}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </section>

            <Connector />

            {/* Step 11: Tracking & Attribution Engine */}
            <section id="step-11" className={`${attributionData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader
                num="11"
                title="Tracking & Attribution Engine"
                subtitle="UTM Mapping · Multi-Touch Attribution · Funnel Analytics · Data Integrity"
                status={attributionData ? (attributionData.tracking_validation?.status || 'Complete') : (routingData ? 'Awaiting Activation' : 'Dormant')}
              />

              {!attributionData ? (
                <div className="py-20 flex flex-col items-center">
                  <button
                    onClick={runAttributionAgent}
                    disabled={isGeneratingAttribution || !routingData}
                    className={`h-16 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 ${
                      isGeneratingAttribution
                        ? 'bg-slate-800 text-slate-500 animate-pulse'
                        : routingData
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-xl shadow-cyan-500/30 scale-105'
                          : 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {isGeneratingAttribution ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin"></div>
                        Running Attribution Analysis...
                      </>
                    ) : 'RUN TRACKING & ATTRIBUTION'}
                  </button>
                  {!routingData && <p className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Complete Step 10 Sales Routing to unlock attribution engine.</p>}
                </div>
              ) : (
                <div id="attribution-output" className="space-y-10 animate-in fade-in zoom-in-95 duration-700">

                  {/* Tracking Health + Dashboard KPIs */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Health Badge */}
                    <div className={`rounded-3xl p-8 border flex flex-col justify-center ${
                      attributionData.tracking_validation?.status === 'TRACKING_HEALTHY' ? 'bg-emerald-500/10 border-emerald-500/30' :
                      attributionData.tracking_validation?.status === 'TRACKING_DEGRADED' ? 'bg-amber-500/10 border-amber-500/30' :
                      'bg-rose-500/10 border-rose-500/30'
                    }`}>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Tracking Status</p>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${
                          attributionData.tracking_validation?.status === 'TRACKING_HEALTHY' ? 'bg-emerald-400' :
                          attributionData.tracking_validation?.status === 'TRACKING_DEGRADED' ? 'bg-amber-400' : 'bg-rose-400'
                        }`}></div>
                        <p className={`text-lg font-black ${
                          attributionData.tracking_validation?.status === 'TRACKING_HEALTHY' ? 'text-emerald-400' :
                          attributionData.tracking_validation?.status === 'TRACKING_DEGRADED' ? 'text-amber-400' : 'text-rose-400'
                        }`}>{attributionData.tracking_validation?.status?.replace(/_/g,' ')}</p>
                      </div>
                      {attributionData.tracking_validation?.flags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {attributionData.tracking_validation.flags.map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[7px] font-black text-amber-400 uppercase">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Leads by Source */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-5">Leads by Source</p>
                      <div className="space-y-3">
                        {[['Paid', attributionData.dashboard?.leads_by_source?.paid, 'text-violet-400','bg-violet-500'],
                          ['Outbound', attributionData.dashboard?.leads_by_source?.outbound, 'text-rose-400','bg-rose-500'],
                          ['Organic', attributionData.dashboard?.leads_by_source?.organic, 'text-sky-400','bg-sky-500']
                        ].map(([src, count, cls, bar], i) => {
                          const total = (attributionData.dashboard?.leads_by_source?.paid||0) + (attributionData.dashboard?.leads_by_source?.outbound||0) + (attributionData.dashboard?.leads_by_source?.organic||0) || 1;
                          const pct = Math.round(((count||0)/total)*100);
                          return (
                            <div key={i}>
                              <div className="flex justify-between mb-1">
                                <span className={`text-[10px] font-black uppercase ${cls}`}>{src}</span>
                                <span className="text-[10px] font-black text-white">{count||0}</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5">
                                <div className={`${bar} h-full rounded-full`} style={{width:`${pct}%`}}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top/Worst Channel */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 space-y-4">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Channel Intelligence</p>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                        <p className="text-[8px] font-black text-emerald-500 uppercase mb-1">🏆 Top Performer</p>
                        <p className="text-sm font-black text-white">{attributionData.dashboard?.top_performing_channel || '–'}</p>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                        <p className="text-[8px] font-black text-rose-500 uppercase mb-1">⚠ Worst CPL</p>
                        <p className="text-sm font-black text-white">{attributionData.dashboard?.worst_performing_channel || '–'}</p>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Total Spend</span>
                        <span className="text-base font-black text-white">${attributionData.dashboard?.total_spend || 0}/day</span>
                      </div>
                    </div>
                  </div>

                  {/* Funnel Waterfall */}
                  <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-3xl p-8">
                    <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-6">Full-Funnel Conversion Waterfall</p>
                    <div className="flex flex-wrap items-end gap-4">
                      {[
                        { label: 'Visitors', value: attributionData.funnel?.total_visitors, rate: null, color: 'bg-cyan-500', text: 'text-cyan-400' },
                        { label: 'Leads', value: attributionData.funnel?.total_leads, rate: attributionData.funnel?.visitor_to_lead_rate, color: 'bg-blue-500', text: 'text-blue-400' },
                        { label: 'Bookings', value: attributionData.funnel?.total_bookings, rate: attributionData.funnel?.lead_to_booking_rate, color: 'bg-violet-500', text: 'text-violet-400' },
                        { label: 'Sales', value: attributionData.funnel?.total_sales, rate: attributionData.funnel?.booking_to_sale_rate, color: 'bg-emerald-500', text: 'text-emerald-400' },
                      ].map((stage, i) => {
                        const maxVal = attributionData.funnel?.total_visitors || 1;
                        const heightPct = Math.max(Math.round(((stage.value||0) / maxVal) * 100), 8);
                        return (
                          <div key={i} className="flex-1 min-w-[80px] flex flex-col items-center gap-2">
                            {stage.rate !== null && stage.rate !== undefined && (
                              <span className="text-[9px] font-black text-slate-500 uppercase">{stage.rate}% ↓</span>
                            )}
                            <div className="w-full flex flex-col items-center">
                              <p className={`text-xl font-black ${stage.text} mb-2`}>{(stage.value||0).toLocaleString()}</p>
                              <div className="w-full rounded-t-xl" style={{height:`${Math.max(heightPct,8)*1.2}px`, background: `linear-gradient(to top, ${stage.color.replace('bg-','').replace('-500','')}, transparent)`}}>
                                <div className={`${stage.color} w-full h-full rounded-t-xl opacity-60`}></div>
                              </div>
                            </div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stage.label}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase">Overall Conversion Rate:</span>
                      <span className="text-sm font-black text-emerald-400">{attributionData.funnel?.overall_conversion}%</span>
                    </div>
                  </div>

                  {/* Channel Performance Table */}
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-5">Channel Performance Metrics</p>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-800">
                            {['Channel','Spend/Day','Clicks','Leads','Bookings','Sales','CPL','CVR','Cost/Booking','Cost/Sale'].map(h => (
                              <th key={h} className="pb-3 text-left text-[8px] font-black text-slate-600 uppercase tracking-widest pr-4 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {(attributionData.channel_performance || []).map((ch, i) => (
                            <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-white whitespace-nowrap">{ch.channel}</p></td>
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-slate-300">${ch.spend}</p></td>
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-slate-300">{ch.clicks}</p></td>
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-emerald-400">{ch.leads}</p></td>
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-sky-400">{ch.bookings}</p></td>
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-amber-400">{ch.sales}</p></td>
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-violet-400">${ch.cpl}</p></td>
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-slate-300">{ch.conversion_rate}%</p></td>
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-slate-300">${ch.cost_per_booking}</p></td>
                              <td className="py-3 pr-4"><p className="text-[11px] font-black text-slate-300">${ch.cost_per_sale}</p></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Lead Attribution Cards */}
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-5">Lead Attribution Records</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {(attributionData.attribution_report || []).map((lead, i) => {
                        const confColor = lead.attribution_confidence === 'HIGH' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                          lead.attribution_confidence === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                          'text-slate-500 bg-slate-800/50 border-slate-700';
                        const decisionColor = lead.final_decision === 'CHECKOUT' ? 'text-emerald-400' :
                          lead.final_decision === 'SALES_CALL' ? 'text-sky-400' :
                          lead.final_decision === 'NURTURE' ? 'text-violet-400' : 'text-slate-500';
                        return (
                          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/20 transition-all space-y-4">
                            {/* Lead Header */}
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-sm shrink-0">{lead.name?.charAt(0)||'?'}</div>
                              <div className="flex-1">
                                <p className="text-sm font-black text-white">{lead.name}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase">{lead.company}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${confColor}`}>{lead.attribution_confidence}</span>
                                <span className={`text-[9px] font-black uppercase ${decisionColor}`}>{lead.final_decision?.replace('_',' ')}</span>
                              </div>
                            </div>

                            {/* UTM Row */}
                            <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl px-4 py-3">
                              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">UTM Parameters</p>
                              <div className="flex flex-wrap gap-1.5">
                                {[['src',lead.utm?.utm_source],['med',lead.utm?.utm_medium],['cmp',lead.utm?.utm_campaign],['cnt',lead.utm?.utm_content],['trm',lead.utm?.utm_term]].filter(([,v])=>v&&v!=='').map(([k,v],j)=>(
                                  <span key={j} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[8px] font-black text-cyan-400 font-mono">{k}={v}</span>
                                ))}
                              </div>
                            </div>

                            {/* Touch Points */}
                            <div>
                              <div className="flex items-center gap-4 mb-2">
                                <div className="flex-1">
                                  <p className="text-[7px] font-black text-slate-600 uppercase">First Touch</p>
                                  <p className="text-[10px] font-black text-violet-400">{lead.first_touch?.source} · {lead.first_touch?.campaign}</p>
                                </div>
                                <div className="text-slate-700">→</div>
                                <div className="flex-1 text-right">
                                  <p className="text-[7px] font-black text-slate-600 uppercase">Last Touch</p>
                                  <p className="text-[10px] font-black text-emerald-400">{lead.last_touch?.source} · {lead.last_touch?.campaign}</p>
                                </div>
                              </div>
                              {lead.touchpoints?.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {lead.touchpoints.map((tp, j) => (
                                    <span key={j} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[8px] font-black text-slate-500">{typeof tp === 'object' ? (tp.event||tp.source||JSON.stringify(tp)) : tp}</span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Conversion + Flags */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[9px] font-black text-slate-600 uppercase">Conversion: <span className="text-white">{lead.conversion_event || '–'}</span></span>
                              {lead.flags?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {lead.flags.map((f,j)=>(
                                    <span key={j} className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[7px] font-black text-amber-400 uppercase">⚠ {f}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Validation Issues */}
                  {attributionData.tracking_validation?.issues?.length > 0 && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-4">Tracking Issues Detected</p>
                      <ul className="space-y-2">
                        {attributionData.tracking_validation.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-500 mt-0.5 shrink-0">✕</span>
                            <p className="text-[11px] text-slate-400 font-bold leading-snug">{typeof issue === 'object' ? JSON.stringify(issue) : issue}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}
            </section>

            <Connector />

            {/* Step 12: Performance Optimisation */}
            <section id="step-12" className={`${performanceData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader num="12" title="Performance Optimisation Engine" subtitle="Kill Losers · Scale Winners · Budget Reallocation · ROI Analysis" status={performanceData ? 'Complete' : (attributionData ? 'Awaiting Activation' : 'Dormant')} />
              {!performanceData ? (
                <div className="py-20 flex flex-col items-center">
                  <button onClick={runPerformanceAgent} disabled={isGeneratingPerformance || !attributionData} className="group relative px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    {isGeneratingPerformance ? 'Analysing Performance...' : (attributionData ? 'Run Performance Audit' : 'Complete Step 11 First')}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-950/50 border border-emerald-500/20 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">ROI</p>
                      <p className="text-3xl font-black text-emerald-400">{performanceData.pipeline_metrics?.roi_percentage || 0}%</p>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Spend</p>
                      <p className="text-3xl font-black text-white">${performanceData.pipeline_metrics?.total_spend || 0}</p>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Est. Revenue</p>
                      <p className="text-3xl font-black text-white">${performanceData.pipeline_metrics?.estimated_revenue || 0}</p>
                    </div>
                  </div>
                  {performanceData.scale_list?.length > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">Scale These Channels</p>
                      {performanceData.scale_list.map((s, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                          <span className="text-xs font-black text-white">{s.channel}</span>
                          <span className="text-[10px] font-bold text-emerald-400">${s.new_budget}/day — {s.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {performanceData.kill_list?.length > 0 && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3">Kill These Channels</p>
                      {performanceData.kill_list.map((k, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                          <span className="text-xs font-black text-white">{k.channel}</span>
                          <span className="text-[10px] font-bold text-rose-400">Save ${k.savings} — {k.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {performanceData.weekly_summary && (
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Weekly Summary</p>
                      <p className="text-xs text-slate-300 font-bold leading-relaxed">{performanceData.weekly_summary}</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            <Connector />

            {/* Step 13: CRM & Data Hygiene */}
            <section id="step-13" className={`${hygieneData ? 'opacity-100' : 'opacity-40'} bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-sm transition-opacity duration-1000`}>
              <StepHeader num="13" title="CRM & Data Hygiene" subtitle="Deduplication · Email Validation · Pipeline Audit · Data Quality Score" status={hygieneData ? 'Complete' : (performanceData ? 'Awaiting Activation' : 'Dormant')} />
              {!hygieneData ? (
                <div className="py-20 flex flex-col items-center">
                  <button onClick={runHygieneAgent} disabled={isGeneratingHygiene || !attributionData} className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    {isGeneratingHygiene ? 'Auditing CRM Data...' : (attributionData ? 'Run Data Hygiene Audit' : 'Complete Step 11 First')}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`bg-slate-950/50 border rounded-2xl p-6 ${hygieneData.data_quality_score >= 80 ? 'border-emerald-500/30' : hygieneData.data_quality_score >= 50 ? 'border-amber-500/30' : 'border-rose-500/30'}`}>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Quality Score</p>
                      <p className={`text-3xl font-black ${hygieneData.data_quality_score >= 80 ? 'text-emerald-400' : hygieneData.data_quality_score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{hygieneData.data_quality_score}/100</p>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Audited</p>
                      <p className="text-3xl font-black text-white">{hygieneData.total_contacts_audited || 0}</p>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Clean</p>
                      <p className="text-3xl font-black text-emerald-400">{hygieneData.summary?.clean_records || 0}</p>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Issues</p>
                      <p className="text-3xl font-black text-rose-400">{hygieneData.summary?.issues_found || 0}</p>
                    </div>
                  </div>
                  {hygieneData.duplicates_found?.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-3">Duplicates Found</p>
                      {hygieneData.duplicates_found.map((d, i) => (
                        <div key={i} className="py-2 border-b border-slate-800/50 last:border-0">
                          <span className="text-xs font-black text-white">{d.name}</span>
                          <span className="text-[10px] text-slate-500 ml-2">{d.email} — {d.occurrences}x — Action: {d.action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {hygieneData.pipeline_mismatches?.length > 0 && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3">Pipeline Mismatches</p>
                      {hygieneData.pipeline_mismatches.map((m, i) => (
                        <div key={i} className="py-2 border-b border-slate-800/50 last:border-0">
                          <span className="text-xs font-black text-white">{m.name}</span>
                          <span className="text-[10px] text-rose-400 ml-2">{m.issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {hygieneData.recommendations?.length > 0 && (
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-3">Recommendations</p>
                      <ul className="space-y-2">
                        {hygieneData.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-violet-500 mt-0.5">→</span>
                            <p className="text-[11px] text-slate-300 font-bold leading-snug">{r}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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