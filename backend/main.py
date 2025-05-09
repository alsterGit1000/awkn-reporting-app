from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import os
from openai import OpenAI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


client = OpenAI(api_key="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")

@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    content = await file.read()
    df = pd.read_excel(io.BytesIO(content))

    summary = generate_summary(df)
    col_names = df.columns.tolist()

    if len(col_names) >= 2:
        chart_data = df[[col_names[0], col_names[1]]].dropna()
        chart_data.columns = ["label", "value"]
        chart_data = chart_data.to_dict(orient="records")
    else:
        chart_data = []

    # NEW: add full data as records
    table_data = df.to_dict(orient="records")

    return {
        "summary": summary,
        "chart_data": chart_data,
        "table_data": table_data,  # <- this is the new key
        "columns": col_names       # optional: useful for headers
    }

def generate_summary(df: pd.DataFrame) -> str:
    desc = df.describe(include='all').to_string()
    prompt = f"Summarize the following spreadsheet data:\n\n{desc}"

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful data analyst."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=300,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"OpenAI API error: {e}"
