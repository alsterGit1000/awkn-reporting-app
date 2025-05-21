from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict
import pandas as pd
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessHeaderRequest(BaseModel):
    sheet_name: str
    header_row_index: int

class UploadResponse(BaseModel):
    summary: str
    chart_data: List[Dict[str, str]]
    columns: List[str]
    rows: List[List[str]]

class SheetPreview(BaseModel):
    sheet_name: str
    preview_rows: List[List[str]]
    suggested_header_row_index: int | None

@app.post("/process-sheet-with-header", response_model=UploadResponse)
async def process_with_custom_header(
    file: UploadFile = File(...),
    sheet_name: str = Form(...),
    header_row_index: int = Form(...)
):
    try:
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content), sheet_name=sheet_name, header=header_row_index)
        return build_response(df)
    except Exception as e:
        logger.error(f"Error processing with custom header: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing with custom header: {e}")

@app.post("/preview-sheet-rows", response_model=SheetPreview)
async def preview_sheet_rows(file: UploadFile = File(...), sheet_name: str = Form(...)):
    try:
        content = await file.read()
        xls = pd.ExcelFile(io.BytesIO(content))

        if sheet_name not in xls.sheet_names:
            raise HTTPException(status_code=400, detail="Invalid sheet name.")

        df_preview = pd.read_excel(xls, sheet_name=sheet_name, header=None)

        preview_rows = df_preview.fillna("").astype(str).values.tolist()

        suggested_index = await suggest_header_row_with_ai(preview_rows)

        return {
            "sheet_name": sheet_name,
            "preview_rows": preview_rows,
            "suggested_header_row_index": suggested_index
        }

    except Exception as e:
        logger.error(f"Error previewing sheet: {e}")
        raise HTTPException(status_code=500, detail=f"Error previewing sheet: {e}")

@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="Invalid file type. Only Excel files are supported.")

    try:
        content = await file.read()
        excel_file = pd.ExcelFile(io.BytesIO(content))
        sheet_names = excel_file.sheet_names

        if len(sheet_names) > 1:
            return {
                "multiple_sheets": True,
                "sheets": sheet_names
            }

        df = excel_file.parse(sheet_names[0])
        return build_response(df)

    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {e}")

@app.post("/process-sheet", response_model=UploadResponse)
async def process_specific_sheet(
    file: UploadFile = File(...), sheet_name: str = Form(...)
):
    try:
        content = await file.read()
        excel_file = pd.ExcelFile(io.BytesIO(content))

        if sheet_name not in excel_file.sheet_names:
            raise HTTPException(status_code=400, detail="Invalid sheet name.")

        df = excel_file.parse(sheet_name)
        return build_response(df)

    except Exception as e:
        logger.error(f"Error processing sheet: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing sheet: {e}")

def build_response(df: pd.DataFrame) -> UploadResponse:
    summary = "(summary disabled)"
    columns = [str(col) for col in df.columns.tolist()]
    rows = df.fillna("").astype(str).values.tolist()

    if len(columns) >= 2:
        chart_df = df[[columns[0], columns[1]]].dropna()
        chart_df.columns = ["label", "value"]
        chart_data = chart_df.astype(str).to_dict(orient="records")
    else:
        chart_data = []

    return UploadResponse(
        summary=summary,
        chart_data=chart_data,
        columns=columns,
        rows=rows,
    )

async def suggest_header_row_with_ai(preview_rows: List[List[str]]) -> int | None:
    # Heuristic fallback: choose first row with more than half non-empty values
    for i, row in enumerate(preview_rows):
        if sum(1 for cell in row if cell.strip()) > len(row) // 2:
            return i
    return 0
