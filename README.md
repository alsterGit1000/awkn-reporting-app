# AWKN Reporting App

An AI-driven spreadsheet reporting tool built for small and medium businesses (SMBs). Upload Excel files, view charted data, and generate smart summaries using GPT-4.

---

## 🚀 Features

- 📤 Upload Excel spreadsheets
- 📊 Visualize data with interactive charts (Recharts)
- 🧠 Generate summaries via OpenAI GPT-4
- 💾 Save and load chart templates *(coming soon)*

---

## 🛠️ Tech Stack

**Frontend:**  
- React + Vite  
- Tailwind CSS  
- Recharts  
- Axios

**Backend:**  
- FastAPI  
- Pandas + OpenPyXL  
- OpenAI GPT-4 API

---

## 📦 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/awkn-reporting-app.git
cd awkn-reporting-app
```

### 2. Set up the backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Set up the frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🔑 OpenAI API Key

You'll need an OpenAI API key for summaries.

1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Replace `"your_openai_api_key_here"` in `backend/main.py`

---

## 📈 Example Output

- Summary of uploaded data
- Simple bar charts using first two columns
- Responsive frontend

---

## 🧩 Coming Soon

- Template saving/loading
- Scheduled reports
- PDF export / emailing
- Cloud storage and user auth

---

## 📄 License

MIT – use it for commercial or personal projects.
