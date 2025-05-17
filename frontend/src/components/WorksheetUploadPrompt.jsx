import React from "react";

const WorksheetUploadPrompt = ({ previews = [], onEdit, onUpload , onRemove}) => {
  if (!Array.isArray(previews) || previews.length === 0) {
    return <div className="text-gray-500">No worksheets to display.</div>;
  }

  return (
    <div className="space-y-4">
      {previews.map((sheet, idx) => (
        <div
          key={sheet.sheet_name || idx}
          className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
        >
          <div className="flex-1">
            <div className="font-semibold">{sheet.sheet_name}</div>
            <div className="text-sm text-gray-500">
              Suggested header row: {sheet.suggested_header_row_index ?? 0}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(sheet.sheet_name)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Review & Edit
            </button>
            <button
              onClick={() =>
                onUpload(sheet.sheet_name, sheet.selected_header_row)
              }
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Upload This Worksheet
            </button>

            <button
              onClick={() => onRemove(sheet.sheet_name)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorksheetUploadPrompt;
