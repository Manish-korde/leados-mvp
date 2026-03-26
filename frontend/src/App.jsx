import { useState } from "react";

function App() {
  const [status, setStatus] = useState("Pending");
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
      if (!response.ok) throw new Error("Webhook returned status " + response.status + ": " + responseText.substring(0, 200));
      if (!responseText || responseText.trim().length === 0) throw new Error("Webhook returned an empty response. The n8n workflow may have errored internally.");
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error("Webhook returned invalid JSON: " + responseText.substring(0, 200));
      }
      
      let extractedOpps = [];
      if (Array.isArray(data)) {
        extractedOpps = data;
      } else if (data && data.opportunities) {
        extractedOpps = data.opportunities;
      } else if (data && data.business_opportunities) {
        extractedOpps = data.business_opportunities;
      } else if (data && typeof data === 'object') {
        const arrayVal = Object.values(data).find(val => Array.isArray(val));
        if (arrayVal) extractedOpps = arrayVal;
      }
      
      const normalizedOpps = extractedOpps.map(opp => ({
        service: opp.service || opp.idea || opp.name || opp.title || "Unnamed Opportunity",
        audience: opp.audience || opp.target_audience || opp.target || "Unknown Audience",
        problem: opp.problem || opp.pain_point || opp.description || "Unknown Problem"
      }));

      setOpportunities(normalizedOpps);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
  
  {/* Sidebar */}
  <div className="w-64 bg-gray-800 p-4">
    <h2 className="text-xl font-bold mb-4">Agents</h2>
    <ul className="space-y-2">
      <li className="p-2 bg-gray-700 rounded cursor-pointer border-l-4 border-blue-500">Agent 1</li>
      <li className="p-2 hover:bg-gray-700 rounded cursor-pointer border-l-4 border-transparent">Agent 2</li>
      <li className="p-2 hover:bg-gray-700 rounded cursor-pointer border-l-4 border-transparent">Agent 3</li>
    </ul>
  </div>

  {/* Main */}
  <div className="flex-1 p-6 flex flex-col justify-center items-center overflow-y-auto">
    
    <h1 className="text-4xl font-bold mb-6">Operator Dashboard</h1>
    
    <button 
      onClick={runAgent1}
      disabled={isLoading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg mb-6 shadow disabled:opacity-50 transition-colors"
    >
      {isLoading ? "Loading..." : "Run Agent 1"}
    </button>

    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-xl shadow-lg border border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Agent Output</h2>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4">
          <p className="text-sm font-medium">Error running agent:</p>
          <p className="text-xs">{error}</p>
        </div>
      )}
      
      {opportunities.length > 0 ? (
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {opportunities.map((opp, idx) => (
            <div key={idx} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors">
              <h3 className="font-bold text-blue-400 text-lg">{opp.service || "N/A Service"}</h3>
              <p className="text-sm mt-2 text-gray-300">
                <strong className="text-gray-400">Audience:</strong> {opp.audience}
              </p>
              <p className="text-sm mt-1 text-gray-300">
                <strong className="text-gray-400">Problem:</strong> {opp.problem}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 mb-4 text-center py-8">
          <p className="text-gray-400">
            {isLoading ? "Fetching opportunities from Agent 1..." : "No opportunities fetched yet. Click \"Run Agent 1\" to start."}
          </p>
        </div>
      )}

      <div className="my-4 pt-4 border-t border-gray-700">
        <span className={`px-3 py-1 rounded-sm text-sm font-medium ${
          status === "Approved" ? "bg-green-500/20 text-green-400" : 
          status === "Rejected" ? "bg-red-500/20 text-red-400" : 
          "bg-yellow-500/20 text-yellow-400"
        }`}>
          Status: {status}
        </span>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setStatus("Approved")}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium transition-colors"
        >
          GO (Approve)
        </button>

        <button
          onClick={() => setStatus("Rejected")}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium transition-colors"
        >
          NO-GO (Reject)
        </button>
      </div>

      <div>
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter feedback for the agent..."
          className="w-full p-3 bg-gray-900 border border-gray-700 text-gray-100 rounded focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
    </div>
  </div>
</div>
  );
}

export default App;