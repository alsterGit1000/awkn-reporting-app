import React, { useState, useRef } from "react";
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
  const [uploads, setUploads] = useState([]);

  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      "http://localhost:8000/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    const data = response.data;

    const newUpload = {
      id: Date.now(), // unique id
      fileName: file.name,
      summary: data.summary,
      chartData: data.chart_data,
      columns: data.columns,
      rows: data.rows,
      showSummary: false,
      showChart: false,
    };

    setUploads((prev) => [...prev, newUpload]);
    fileInputRef.current.value = null;
  };

  const toggleSummary = (id) => {
    setUploads((prevUploads) =>
      prevUploads.map((upload) =>
        upload.id === id
          ? { ...upload, showSummary: !upload.showSummary }
          : upload
      )
    );
  };

  const toggleChart = (id) => {
    setUploads((prevUploads) =>
      prevUploads.map((upload) =>
        upload.id === id ? { ...upload, showChart: !upload.showChart } : upload
      )
    );
  };

  const removeUpload = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this spreadsheet?"
    );
    if (confirmDelete) {
      setUploads((prev) => prev.filter((upload) => upload.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-indigo-700">
            Spreadsheet Transformer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload and analyze spreadsheet data
          </p>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <label className="block text-sm font-medium mb-2">
            + Add Excel File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleUpload}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-white file:bg-indigo-600 hover:file:bg-indigo-700"
          />
        </div>

        {uploads.map((upload) => (
          <div key={upload.id} className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">{upload.fileName}</h2>

            <div className="overflow-auto mb-4">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    {upload.columns.map((col, i) => (
                      <th
                        key={i}
                        className="text-left p-2 border-b font-semibold"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upload.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((val, j) => (
                        <td key={j} className="p-2 border-b">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={() => toggleSummary(upload.id)}
                Ok
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                {upload.showSummary ? "Hide Summary" : "Show Summary"}
              </button>
              <button
                onClick={() => toggleChart(upload.id)}
                className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
              >
                {upload.showChart ? "Hide Chart" : "Show Chart"}
              </button>

              <button
                onClick={() => removeUpload(upload.id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>

            {upload.showSummary && (
              <div className="mt-4 whitespace-pre-line text-sm text-gray-700">
                {upload.summary}
              </div>
            )}

            {upload.showChart &&
              upload.chartData &&
              upload.chartData.length > 0 && (
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={upload.chartData}>
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
