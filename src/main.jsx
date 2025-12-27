import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router-dom' // 1. IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* 2. OBALIT ZDE */}
      <AuthProvider>
        <DataProvider>
          <App />
          <Toaster position="top-center" toastOptions={{
            style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
          }}/>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)