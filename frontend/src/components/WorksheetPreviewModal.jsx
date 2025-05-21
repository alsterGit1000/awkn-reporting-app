import React, { useState, useRef } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";

function WorksheetPreviewModal({ previews, onClose, onConfirmUpload }) {
  const preview = previews[0];
  const [data, setData] = useState(preview.preview_rows);
  const [selectedHeaderRow, setSelectedHeaderRow] = useState(null);

  const hotRef = useRef(null);

  const handleContextMenu = (event, coords) => {
    if (coords?.row >= 0) {
      setSelectedHeaderRow(coords.row);
    }
  };

  const handleBeforeRemoveRow = (index, amount) => {
    if (selectedHeaderRow >= index) {
      setSelectedHeaderRow((prev) => Math.max(0, prev - amount));
    }
  };

  const handleAfterRemoveRow = () => {
    // Handsontable manages row removal internally; no manual state update needed.
  };

  const handleAfterRemoveCol = () => {
    // Handsontable manages column removal internally; no manual state update needed.
  };

  const handleUpload = () => {
    onConfirmUpload(preview.sheet_name, selectedHeaderRow);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] shadow-xl space-y-4 relative overflow-hidden">
        <h2 className="text-xl font-bold">
          Edit Worksheet: {preview.sheet_name}
        </h2>

        <div className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md p-3 leading-relaxed">
          <p>
            1. Click on a row number to select a row, or a column letter to
            select a column.
          </p>
          <p>
            2. Right click to take row or column actions such as insert or
            delete.
          </p>
          <p>3. Column header row is indicated in light green.</p>
        </div>

        <div
          className="border rounded overflow-hidden"
          style={{ height: "400px" }}
        >
          <HotTable
            data={data}
            colHeaders={(index) => String.fromCharCode(65 + index)}
            rowHeaders={true}
            height="400px"
            width="100%"
            contextMenu={{
              items: {
                row_above: {},
                row_below: {},
                remove_row: {},
                col_left: {},
                col_right: {},
                remove_col: {},
                copy: {},
                cut: {},
                set_header_row: {
                  name: "Set Row as Column Headings",
                  callback: function (_, selection) {
                    if (selection?.length) {
                      const row = selection[0].start.row;
                      setSelectedHeaderRow(row);
                    }
                  },
                },
              },
            }}
            manualRowResize={true}
            manualColumnResize={true}
            fixedRowsTop={selectedHeaderRow + 1}
            afterRemoveCol={handleAfterRemoveCol}
            afterRemoveRow={handleAfterRemoveRow}
            cells={(row, col) => {
              const cellProperties = {};
              if (row === selectedHeaderRow) {
                cellProperties.renderer = (instance, td, ...rest) => {
                  Handsontable.renderers.TextRenderer(instance, td, ...rest);
                  td.style.background = "#dcfce7"; // Light green (Tailwind's bg-green-100)
                  td.style.fontWeight = "bold";
                };
              }
              return cellProperties;
            }}
            licenseKey="non-commercial-and-evaluation"
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          {selectedHeaderRow !== 0 && (
            <p className="text-sm text-red-600">
              Please set the top row (row 1) as the column header before
              uploading.
            </p>
          )}
          <button
            onClick={handleUpload}
            disabled={selectedHeaderRow !== 0}
            className={`px-4 py-2 rounded text-white ${
              selectedHeaderRow === 0
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Upload This Worksheet
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorksheetPreviewModal;
