import React, { useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function App() {
  const [summary, setSummary] = useState('')
  const [chartData, setChartData] = useState([])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post('http://localhost:8000/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    setSummary(response.data.summary)
    setChartData(response.data.chart_data)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AWKN Reporting App</h1>
      <input type="file" accept=".xlsx" onChange={handleUpload} className="mb-4" />
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Summary</h2>
        <p className="whitespace-pre-line">{summary}</p>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default App
