import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [data, setData] = useState(null)
  const API_URL = "http://127.0.0.1:8000" 

  useEffect(() => {
    axios.get(`${API_URL}/api/ml-result`)
      .then(response => {
        setData(response.data)
      })
      .catch(error => console.error("Error fetching data:", error))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">ML Portfolio</h1>
      {data ? (
        <div className="mt-4 p-4 border rounded shadow">
          <p><strong>모델명:</strong> {data.model_name}</p>
          <p><strong>정확도:</strong> {data.accuracy * 100}%</p>
        </div>
      ) : (
        <p>loading</p>
      )}
    </div>
  )
}
export default App