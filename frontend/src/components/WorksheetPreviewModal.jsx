// components/WorksheetPreviewModal.jsx
import React from "react";

const WorksheetPreviewModal = ({ previews, onClose, onConfirmUpload }) => {
  return (
    <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Worksheet Preview</h2>

        {previews.map((sheet, idx) => (
          <div key={idx} className="border p-4 rounded-lg bg-slate-50 shadow-sm">
            <h3 className="font-semibold mb-2">{sheet.sheet_name}</h3>
            <p className="mb-2 text-sm text-gray-600">
              AI suggested header row:{" "}
              <strong>Row {sheet.suggested_header_row_index}</strong>
            </p>

            <div className="overflow-auto max-h-60">
              <table className="min-w-full text-sm border border-gray-300">
                <tbody>
                  {sheet.preview_rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={
                        rowIdx === sheet.suggested_header_row_index
                          ? "bg-yellow-100"
                          : ""
                      }
                    >
                      {row.map((cell, colIdx) => (
                        <td
                          key={colIdx}
                          className="border px-2 py-1 text-gray-700"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <label className="text-sm">
                Choose header row:
                <input
                  type="number"
                  min={0}
                  max={sheet.preview_rows.length - 1}
                  value={sheet.selected_header_row}
                  onChange={(e) =>
                    sheet.setSelectedHeaderRow(Number(e.target.value))
                  }
                  className="ml-2 w-16 border px-2 py-1 rounded"
                />
              </label>

              <button
                onClick={() =>
                  onConfirmUpload(sheet.sheet_name, sheet.selected_header_row)
                }
                className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Upload This Worksheet
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorksheetPreviewModal;
