from fastapi import FastAPI, UploadFile, File, HTTPException
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

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You may want to restrict this in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response model
class UploadResponse(BaseModel):
    summary: str
    chart_data: List[Dict[str, str]]
    columns: List[str]
    rows: List[List[str]]


@app.post("/upload", response_model=UploadResponse)
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="Invalid file type. Only Excel files are supported.")

    try:
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content))

        summary = generate_summary(df)
        columns = df.columns.tolist()
        rows = df.fillna("").astype(str).values.tolist()

        # Basic chart data extraction
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

    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {e}")


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

