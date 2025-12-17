import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// Navbar odstraněn

// Stránky
import SeznamLidi from './pages/SeznamLidi'
import DetailOsoby from './pages/DetailOsoby'
import Cinnosti from './pages/Cinnosti'

function App() {
  return (
    <Router>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' },
          success: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      
      {/* Navbar zde není */}
      
      <Routes>
        <Route path="/" element={<SeznamLidi />} />
        <Route path="/osoba/:id" element={<DetailOsoby />} />
        <Route path="/cinnosti" element={<Cinnosti />} />
        {/* Fallback */}
        <Route path="/aktivity" element={<Cinnosti />} />
      </Routes>
    </Router>
  )
}

export default App