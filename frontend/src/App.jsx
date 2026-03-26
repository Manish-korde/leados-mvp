import { useState } from "react";

function OpportunityCard({ opp, index, onAction }) {
  const [selectedAction, setSelectedAction] = useState(null);

  const handleAction = (action) => {
    setSelectedAction(action);
    onAction(index, action);
  };

  const getIntensityColor = (intensity) => {
    const val = (intensity || "").toLowerCase();
    if (val === "high") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (val === "medium") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const getPayColor = (pay) => {
    const val = (pay || "").toLowerCase();
    if (val === "high") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (val === "medium") return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  return (
    <div className="group bg-slate-900/40 rounded-2xl border border-slate-800 p-6 flex flex-col h-full hover:bg-slate-900/60 hover:border-blue-500/30 transition-all duration-300 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight mb-1">{opp.service}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Audience</span>
            <span className="text-xs text-slate-300 font-semibold">{opp.audience}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black border uppercase tracking-tighter ${getIntensityColor(opp.pain_intensity)}`}>
            Pain: {opp.pain_intensity}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black border uppercase tracking-tighter ${getPayColor(opp.willingness_to_pay)}`}>
            Pay: {opp.willingness_to_pay}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 flex-1">
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pain Point Analysis</h4>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium italic">"{opp.problem}"</p>
        </section>

        {opp.evidence && opp.evidence.length > 0 && (
          <section className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">Evidence Signals</h4>
            <div className="flex flex-col gap-2">
              {opp.evidence.slice(0, 2).map((ev, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-1 h-1 rounded-full bg-slate-700 mt-1.5 shrink-0"></div>
                  <p className="text-[11px] text-slate-400 leading-tight italic">{ev}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-6 py-4 border-y border-slate-800/50">
          <div>
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Frequency</h4>
            <p className="text-xs text-slate-300 font-bold">{opp.frequency}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Competitors</h4>
            <p className="text-xs text-slate-300 font-bold">{opp.existing_solutions}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5 px-0.5">
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Confidence Index</h4>
            <span className="text-xs font-black text-blue-500">{opp.confidence_score}%</span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-sky-400 h-full transition-all duration-1000 ease-out" 
              style={{ width: `${opp.confidence_score}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="grid grid-cols-3 gap-2 mt-8">
        {[
          { id: "GO", color: "hover:bg-emerald-500 hover:text-white hover:border-emerald-400 bg-slate-800/50 text-slate-400 active:bg-emerald-600" },
          { id: "NO-GO", color: "hover:bg-rose-500 hover:text-white hover:border-rose-400 bg-slate-800/50 text-slate-400 active:bg-rose-600" },
          { id: "REVISE", color: "hover:bg-amber-500 hover:text-white hover:border-amber-400 bg-slate-800/50 text-slate-400 active:bg-amber-600" }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => handleAction(btn.id)}
            className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent transition-all duration-200 ${
              selectedAction === btn.id 
                ? btn.color.split(" ").find(c => c.startsWith("hover:bg-")).replace("hover:bg-", "bg-") + " text-white"
                : btn.color
            }`}
          >
            {btn.id}
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [feedback, setFeedback] = useState("");
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAgent1 = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/webhook-test/378e8d91-f130-400e-8f13-c8c7961279d0");
      const responseText = await response.text();
      
      if (!response.ok) throw new Error(`Webhook Error (${response.status}): ${responseText.substring(0, 100)}`);
      if (!responseText) throw new Error("Empty response from Agent 1.");

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        throw new Error("Invalid structure returned from Agent 1.");
      }
      
      let extractedOpps = [];
      if (Array.isArray(data)) extractedOpps = data;
      else if (data && data.opportunities) extractedOpps = data.opportunities;
      else if (data && typeof data === 'object') {
        const arrayVal = Object.values(data).find(val => Array.isArray(val));
        if (arrayVal) extractedOpps = arrayVal;
      }
      
      const normalizedOpps = extractedOpps.map(opp => ({
        service: opp.service || "Unnamed Service",
        audience: opp.audience || "Unknown",
        problem: opp.problem || "No problem defined",
        pain_intensity: opp.pain_intensity || "Low",
        frequency: opp.frequency || "Rarely",
        evidence: Array.isArray(opp.evidence) ? opp.evidence : [],
        existing_solutions: opp.existing_solutions || "N/A",
        willingness_to_pay: opp.willingness_to_pay || "Low",
        confidence_score: opp.confidence_score || 0,
        selection: null
      }));

      setOpportunities(normalizedOpps);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardAction = (index, action) => {
    const updated = [...opportunities];
    updated[index].selection = action;
    setOpportunities(updated);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800/50 p-8 flex flex-col h-full shadow-2xl relative z-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-sky-400 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-500/20">L</div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white leading-none">LeadOS</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">v1.2.0 Signal-Ready</p>
          </div>
        </div>
        
        <div className="space-y-8 flex-1">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Monitor Engine</h3>
            <nav className="space-y-1">
              <div className="flex items-center justify-between p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-inner group transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[11px] font-black uppercase tracking-wider italic">Research Node</span>
                </div>
                <span className="text-[9px] font-bold opacity-50">AGENT 1</span>
              </div>
            </nav>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 px-2 italic">Upcoming Pipeline</h3>
            <nav className="space-y-1">
              {["Offer Node", "Outreach Node"].map((node, i) => (
                <div key={i} className="flex items-center justify-between p-3 text-slate-600 hover:bg-slate-800/40 rounded-xl group transition-all cursor-not-allowed opacity-40 grayscale">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider">{node}</span>
                  </div>
                  <span className="text-[9px] font-bold">AGENT {i + 2}</span>
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="pt-8 mt-auto border-t border-slate-800/50">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-400 uppercase">MK</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-white leading-none">Manish Korde</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Operator Profile</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sky-600/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        <header className="h-20 border-b border-slate-800/40 flex items-center justify-between px-10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-300">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">Dashboard</h1>
            <div className="w-1 h-1 rounded-full bg-slate-600 mx-2"></div>
            <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">Operational Interface</span>
          </div>
          
          <button 
            onClick={runAgent1}
            disabled={isLoading}
            className={`group h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shadow-2xl relative overflow-hidden ${
              isLoading 
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                : "bg-white text-slate-950 hover:bg-white hover:scale-[1.02] active:scale-95 shadow-white/5"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-[3px] border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                Analyzing Ecosystem...
              </>
            ) : (
              "Trigger Signal Scout"
            )}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-12 scroll-smooth custom-scrollbar">
          {error && (
            <div className="max-w-7xl mx-auto mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex items-center gap-4 text-rose-400 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center font-black text-lg border border-rose-500/20">!</div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Signal Disruption Detected</p>
                  <p className="text-xs font-bold opacity-80">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-xs font-black opacity-50 hover:opacity-100 uppercase tracking-widest">Dismiss</button>
              </div>
            </div>
          )}

          {opportunities.length > 0 ? (
            <div className="max-w-7xl mx-auto">
              <header className="mb-12 border-l-4 border-blue-500 pl-8 py-2 animate-in fade-in slide-in-from-left-4 duration-700">
                <h2 className="text-5xl font-black text-white tracking-tighter mb-2 italic">Intelligence Report</h2>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Source: Reddit (r/startups)
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                  <p className="text-slate-500 text-xs font-bold">Signal accuracy verified by LeadOS Engine.</p>
                </div>
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 px-0.5">
                {opportunities.map((opp, idx) => (
                  <div key={idx} className="animate-in fade-in zoom-in-95 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                    <OpportunityCard 
                      opp={opp} 
                      index={idx} 
                      onAction={handleCardAction} 
                    />
                  </div>
                ))}
              </div>

              {/* Enhanced Feedback Section */}
              <div className="max-w-4xl bg-slate-900/40 p-10 rounded-[32px] border border-slate-800 shadow-3xl backdrop-blur-md mb-20 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-transparent"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4 italic">Signal Optimization</h3>
                    <h4 className="text-2xl font-black text-white mb-2 tracking-tight">Refine Global Intelligence</h4>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-md">Provide context to the Offer Agent for the next processing stage. Your feedback recalibrates the discovery engine.</p>
                  </div>
                  <div className="w-full md:w-[450px] flex flex-col gap-4">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Enter specific refinements for the Offer Agent..."
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-6 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none h-32 text-slate-300 font-medium placeholder:text-slate-700 shadow-inner"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black px-4 py-3.5 rounded-xl text-[10px] transition-all uppercase tracking-widest border border-slate-700 shadow-xl shadow-black/20">
                        Save Draft
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-3.5 rounded-xl text-[10px] transition-all uppercase tracking-widest shadow-xl shadow-blue-600/10">
                        Pass to Next Agent
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in fade-in duration-1000">
              <div className="relative mb-10 group">
                <div className="absolute -inset-8 bg-blue-600/10 blur-[40px] rounded-full group-hover:bg-blue-600/20 transition-all duration-500"></div>
                <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center relative border border-slate-800 shadow-inner overflow-hidden">
                  <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent"></div>
                  <div className="w-8 h-8 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              </div>
              <h2 className="text-4xl font-black text-white mb-4 tracking-tighter italic">Engine Status: Idle</h2>
              <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed uppercase tracking-widest px-4">
                Operational dashboard awaits signal trigger protocol. Monitoring ecosystem for active pain patterns.
              </p>
              
              <div className="mt-12 flex gap-4">
                <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Online</span>
                </div>
                <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LLM Connected</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;