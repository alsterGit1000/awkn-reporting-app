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
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [sheetToRemove, setSheetToRemove] = useState(null);
  const [sheetSelection, setSheetSelection] = useState([]);
  const fileInputRef = useRef(null);

  const [allSheetNames, setAllSheetNames] = useState([]);

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
      setAllSheetNames(data.sheets);
      setSheetSelection(data.sheets); // Populating sheet selection dialog

      // Show worksheet selection modal (styled similar to the page)
      return; // Prevent further code execution for now
    }

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

  const handleSheetSelection = async () => {
    for (const sheetName of sheetSelection) {
      const sheetForm = new FormData();
      sheetForm.append("file", fileInputRef.current.files[0]); // Using uploaded file
      sheetForm.append("sheet_name", sheetName);

      const sheetRes = await axios.post(
        "http://localhost:8000/process-sheet",
        sheetForm
      );

      const upload = {
        id: Date.now() + Math.random(),
        fileName: `${fileInputRef.current.files[0].name} - ${sheetName}`,
        summary: sheetRes.data.summary,
        chartData: sheetRes.data.chart_data,
        columns: sheetRes.data.columns,
        rows: sheetRes.data.rows,
        showSummary: false,
        showChart: false,
      };

      setUploads((prev) => [...prev, upload]);
    }
    setSheetSelection([]); // Reset the selection after submission
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

  const removeUpload = () => {
    setUploads((prev) =>
      prev.filter((upload) => upload.id !== sheetToRemove.id)
    );
    setConfirmDialogOpen(false);
  };

  const openRemoveDialog = (upload) => {
    setSheetToRemove(upload);
    setConfirmDialogOpen(true);
  };

  const closeRemoveDialog = () => {
    setConfirmDialogOpen(false);
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

        {/* Worksheet Selection Modal */}
        {sheetSelection.length > 0 && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h2 className="text-xl font-semibold mb-4">Select Worksheets</h2>
              <p>Select the worksheets you want to keep:</p>
              <div className="mt-4">
                {allSheetNames.map((sheet, index) => {
                  const isSelected = sheetSelection.includes(sheet);
                  return (
                    <div key={index} className="mb-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSheetSelection((prev) =>
                              isSelected
                                ? prev.filter((s) => s !== sheet)
                                : [...prev, sheet]
                            );
                          }}
                          className="mr-2"
                        />
                        <span
                          className={
                            isSelected ? "text-gray-800" : "text-gray-400"
                          }
                        >
                          {sheet}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={() => setSheetSelection([])} // Close without selection
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSheetSelection} // Handle the selected sheets
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

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
                onClick={() => openRemoveDialog(upload)}
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

        {/* Confirmation Dialog */}
        {isConfirmDialogOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h2 className="text-xl font-semibold mb-4">Confirm Removal</h2>
              <p>
                Are you sure you want to remove the sheet "
                {sheetToRemove?.fileName}"?
              </p>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={closeRemoveDialog}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={removeUpload}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
