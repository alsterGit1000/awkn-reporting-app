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

    if (data.multiple_sheets) {
      const confirmSplit = window.confirm(
        `This file contains multiple sheets:\n${data.sheets.join(
          ", "
        )}\n\nWould you like to treat each sheet as a separate upload?`
      );

      if (confirmSplit) {
        for (const sheetName of data.sheets) {
          const sheetForm = new FormData();
          sheetForm.append("file", file);
          sheetForm.append("sheet_name", sheetName);

          const sheetRes = await axios.post(
            "http://localhost:8000/process-sheet",
            sheetForm
          );

          const upload = {
            id: Date.now() + Math.random(),
            fileName: `${file.name} - ${sheetName}`,
            summary: sheetRes.data.summary,
            chartData: sheetRes.data.chart_data,
            columns: sheetRes.data.columns,
            rows: sheetRes.data.rows,
            showSummary: false,
            showChart: false,
          };

          setUploads((prev) => [...prev, upload]);
        }
      } else {
        // Optionally: default to first sheet only
        const firstSheet = data.sheets[0];
        const sheetForm = new FormData();
        sheetForm.append("file", file);
        sheetForm.append("sheet_name", firstSheet);

        const sheetRes = await axios.post(
          "http://localhost:8000/process-sheet",
          sheetForm
        );

        const upload = {
          id: Date.now(),
          fileName: `${file.name} - ${firstSheet}`,
          summary: sheetRes.data.summary,
          chartData: sheetRes.data.chart_data,
          columns: sheetRes.data.columns,
          rows: sheetRes.data.rows,
          showSummary: false,
          showChart: false,
        };

        setUploads((prev) => [...prev, upload]);
      }

      fileInputRef.current.value = null;
      return;
    }

    // Handle single sheet
    const newUpload = {
      id: Date.now(),
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

            <div className="mb-4 border rounded">
              <div className="overflow-y-auto max-h-64">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-slate-100">
                    <tr>
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
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={() => toggleSummary(upload.id)}
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

            {upload.showChart && upload.chartData.length > 0 && (
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

