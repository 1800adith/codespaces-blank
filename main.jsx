import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // 👈 Changed from '@/App.jsx'
import './index.css'        // 👈 Changed from '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
