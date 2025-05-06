from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import openai
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = "your_openai_api_key_here"

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

    return {"summary": summary, "chart_data": chart_data}

def generate_summary(df: pd.DataFrame) -> str:
    desc = df.describe(include='all').to_string()
    prompt = f"Summarize the following spreadsheet data:\n\n{desc}"

    response = openai.ChatCompletion.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful data analyst."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=300,
    )
    return response.choices[0].message["content"]
