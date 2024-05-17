import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const defaultConfig = [
  {
    "name": "Alice",
    "timezone": "America/New_York",
    "workHours": ["0900", "1700"]
  },
  {
    "name": "Bob",
    "timezone": "Europe/Berlin",
    "workHours": ["0800", "1600"]
  },
  {
    "name": "Charlie",
    "timezone": "Asia/Tokyo",
    "workHours": ["1000", "1800"]
  },
  {
    "name": "Dave",
    "timezone": "America/Sao_Paulo",
    "workHours": ["0700", "1500"]
  },
  {
    "name": "Eve",
    "timezone": "Europe/Athens",
    "workHours": ["0900", "1700"]
  }
];

if (!localStorage.getItem('team')) {
  localStorage.setItem('team', JSON.stringify(defaultConfig, null, 2));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
