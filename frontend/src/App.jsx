import { useState } from "react";

function App() {
  const [status, setStatus] = useState("Pending");
  const [feedback, setFeedback] = useState("");

  const output = {
    agent: "Agent 1 - Research",
    result: "Top opportunity: Lead generation for construction companies",
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
  
  {/* Sidebar */}
  <div className="w-64 bg-gray-800 p-4">
    <h2 className="text-xl font-bold mb-4">Agents</h2>
    <ul className="space-y-2">
      <li className="p-2 bg-gray-700 rounded cursor-pointer">Agent 1</li>
      <li className="p-2 hover:bg-gray-700 rounded cursor-pointer">Agent 2</li>
      <li className="p-2 hover:bg-gray-700 rounded cursor-pointer">Agent 3</li>
    </ul>
  </div>

  {/* Main */}
  <div className="flex-1 p-6 flex flex-col justify-center items-center">
    
    <h1 className="text-4xl font-bold mb-6">Operator Dashboard</h1>

    <div className="bg-gray-800 p-6 rounded w-full max-w-xl">
      <h2 className="text-lg font-semibold mb-2">Agent Output</h2>
      <p>{output.result}</p>

      <div className="my-4">
        <span className="px-3 py-1 rounded bg-yellow-500 text-black">
          {status}
        </span>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setStatus("Approved")}
          className="bg-green-600 px-4 py-2 rounded"
        >
          GO
        </button>

        <button
          onClick={() => setStatus("Rejected")}
          className="bg-red-600 px-4 py-2 rounded"
        >
          NO-GO
        </button>
      </div>

      <div>
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter feedback..."
          className="w-full p-2 text-black rounded"
        />
      </div>
    </div>
  </div>
</div>
  );
}

export default App;