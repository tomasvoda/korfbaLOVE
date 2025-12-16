import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast' // <--- 1. IMPORT
import SeznamLidi from './pages/SeznamLidi'
import DetailOsoby from './pages/DetailOsoby'

function App() {
  return (
    <Router>
      {/* 2. PŘIDAT TOASTER (Nastavíme mu tmavý styl) */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b', // slate-800
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e', // green-500
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        <Route path="/" element={<SeznamLidi />} />
        <Route path="/osoba/:id" element={<DetailOsoby />} />
      </Routes>
    </Router>
  )
}

export default App
