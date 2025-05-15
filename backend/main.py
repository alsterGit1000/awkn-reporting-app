from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import pandas as pd
import io
import os
import openai
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="awkn_openai_key.env")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

openai.api_key = os.getenv("OPENAI_API_KEY")

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

        df_preview = pd.read_excel(xls, sheet_name=sheet_name, header=None, nrows=10)
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
    summary = generate_summary(df)
    columns = df.columns.tolist()
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


def generate_summary(df: pd.DataFrame) -> str:
    try:
        desc = df.describe(include="all").to_string()
        prompt = (
            "You are a data analyst. Given the descriptive statistics below from an Excel sheet, "
            "provide a concise and insightful summary. Focus on trends, outliers, and interesting facts.\n\n"
            f"Descriptive statistics:\n{desc}"
        )

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful data analyst."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=300,
        )
        return response["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return f"OpenAI API error: {e}"
    
    
async def suggest_header_row_with_ai(preview_rows: List[List[str]]) -> int | None:
    try:
        table_preview = "\n".join(
            f"Row {i}: {row}" for i, row in enumerate(preview_rows)
        )

        prompt = (
            "Here is a preview of the top rows from a spreadsheet. "
            "Which row (0-indexed) most likely contains column headers?\n\n"
            f"{table_preview}\n\n"
            "Respond with only the row number."
        )

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert in spreadsheet data cleaning."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=10,
        )

        answer = response["choices"][0]["message"]["content"].strip()
        return int(answer) if answer.isdigit() else None

    except Exception as e:
        logger.warning(f"AI header row suggestion failed: {e}")
        return None

