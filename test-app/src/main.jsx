import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import aiSdk from '@phantomui/sdk'

window.__aiSdk = aiSdk

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
