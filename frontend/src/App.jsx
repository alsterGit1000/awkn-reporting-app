import React, { useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [summary, setSummary] = useState("");
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      "http://localhost:8000/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    setSummary(response.data.summary);
    setChartData(response.data.chart_data);
    setTableData(response.data.table_data || []); // expecting backend to return this
    setTableColumns(response.data.columns || []); // same here
    setShowSummary(false); // reset summary visibility
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AWKN Reporting App</h1>

      <input
        type="file"
        accept=".xlsx"
        onChange={handleUpload}
        className="mb-4"
      />

      {/* Table Display */}
      {tableColumns.length > 0 && tableData.length > 0 && (
        <div className="mb-6 overflow-x-auto border rounded-lg">
          <table className="table-auto w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                {tableColumns.map((col) => (
                  <th key={col} className="px-4 py-2 border">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  {tableColumns.map((col) => (
                    <td key={col} className="px-4 py-2 border">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Toggle Chart Button */}
      {chartData.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowChart(!showChart)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            {showChart ? "Hide Chart" : "Show Chart"}
          </button>
        </div>
      )}

      {/* Summary Panel */}
      {showSummary && (
        <div className="bg-gray-50 border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Summary</h2>
          <p className="whitespace-pre-line">{summary}</p>
        </div>
      )}

      {/* Toggle Summary Button */}
      {summary && (
        <div className="mb-4">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            {showSummary ? "Hide Summary" : "Show Summary"}
          </button>
        </div>
      )}

      {/* Chart */}
      {showChart && chartData.length > 0 && (
        <div style={{ width: "100%", height: 300 }} className="mt-6">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default App;
