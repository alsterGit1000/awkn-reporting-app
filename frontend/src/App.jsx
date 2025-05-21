import React, { useState, useRef } from "react";
import axios from "axios";
import WorksheetPreviewModal from "./components/WorksheetPreviewModal";
import WorksheetUploadPrompt from "./components/WorksheetUploadPrompt";


function App() {
  const [uploads, setUploads] = useState([]);
  const [pendingPreviews, setPendingPreviews] = useState([]);
  const [fileForPreview, setFileForPreview] = useState(null);
  const [sheetInEdit, setSheetInEdit] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileContent = new FormData();
    fileContent.append("file", file);

    const uploadRes = await axios.post(
      "http://localhost:8000/upload",
      fileContent,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    const { sheets } = uploadRes.data.multiple_sheets
      ? uploadRes.data
      : { sheets: [uploadRes.data.columns ? "Sheet1" : "Sheet"] };

    const previews = [];

    for (const sheetName of sheets) {
      const form = new FormData();
      form.append("file", file);
      form.append("sheet_name", sheetName);

      const previewRes = await axios.post(
        "http://localhost:8000/preview-sheet-rows",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      previews.push({
        sheet_name: sheetName,
        ...previewRes.data,
        selected_header_row: previewRes.data.suggested_header_row_index || 0,
        setSelectedHeaderRow: (val) =>
          setPendingPreviews((prev) =>
            prev.map((s) =>
              s.sheet_name === sheetName
                ? { ...s, selected_header_row: val }
                : s
            )
          ),
      });
    }

    setFileForPreview(file);
    setPendingPreviews(previews);
    fileInputRef.current.value = null; // ✅ Allows re-selecting same file later
  };

  const handleConfirmUpload = async (sheetName, headerRowIndex) => {
    const form = new FormData();
    form.append("file", fileForPreview);
    form.append("sheet_name", sheetName);
    form.append("header_row_index", headerRowIndex);

    const res = await axios.post(
      "http://localhost:8000/process-sheet-with-header",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    const upload = {
      id: Date.now() + Math.random(),
      fileName: `${fileForPreview.name} - ${sheetName}`,
      summary: res.data.summary,
      chartData: res.data.chart_data,
      columns: res.data.columns,
      rows: res.data.rows,
    };

    setUploads((prev) => [...prev, upload]);

    // Remove the processed preview
    setPendingPreviews((prev) =>
      prev.filter((p) => p.sheet_name !== sheetName)
    );

    setSheetInEdit(null);
  };

  const handleEdit = (sheetName) => {
    const preview = pendingPreviews.find((s) => s.sheet_name === sheetName);
    if (preview) {
      setSheetInEdit(preview);
    }
  };

  const removeUpload = (uploadId) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
  };

  const removePendingSheet = (sheetName) => {
    setPendingPreviews((prev) =>
      prev.filter((sheet) => sheet.sheet_name && sheet.sheet_name !== sheetName)
    );
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
          <div className="flex items-center gap-4">
            <label className="relative inline-block">
              <span
                className={`block cursor-pointer text-sm font-medium px-4 py-2 rounded-md ${
                  pendingPreviews.length > 0
                    ? "bg-indigo-300 text-white cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                + Choose Excel File
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleUpload}
                disabled={pendingPreviews.length > 0}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>

            {pendingPreviews.length > 0 && fileForPreview && (
              <span className="text-sm text-gray-500 italic">
                Finish processing: <strong>{fileForPreview.name}</strong>
              </span>
            )}
          </div>
          {pendingPreviews.length > 0 && (
            <div className="space-y-4 mt-8">
              <h2 className="text-2xl font-bold text-indigo-600">
                Pending Uploads
              </h2>
              <WorksheetUploadPrompt
                previews={pendingPreviews}
                onEdit={handleEdit}
                onUpload={handleConfirmUpload}
                onRemove={removePendingSheet}
              />
            </div>
          )}
        </div>

        {uploads.length > 0 && (
          <div className="space-y-4 mt-12">
            <h2 className="text-2xl font-bold text-green-700">
              Uploaded Worksheets
            </h2>
            {/* Uploaded Sheet Display */}
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-white p-6 rounded-2xl shadow-md"
              >
                <h2 className="text-lg font-semibold mb-4">
                  {upload.fileName}
                </h2>

                <div className="mb-4 border rounded overflow-y-auto max-h-64">
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

                <div className="mt-4">
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {sheetInEdit && (
          <WorksheetPreviewModal
            previews={[sheetInEdit]}
            onClose={() => setSheetInEdit(null)}
            onConfirmUpload={handleConfirmUpload}
          />
        )}
      </div>
    </div>
  );
}

export default App;
