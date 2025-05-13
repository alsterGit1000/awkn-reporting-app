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

class UploadResponse(BaseModel):
    summary: str
    chart_data: List[Dict[str, str]]
    columns: List[str]
    rows: List[List[str]]


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


