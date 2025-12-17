import { Link, useLocation } from 'react-router-dom'
import { Users, Calendar } from 'lucide-react'

function Navbar() {
  const location = useLocation()
  const path = location.pathname

  const links = [
    { to: '/', label: 'Lidé', icon: Users },
    { to: '/cinnosti', label: 'Činnosti', icon: Calendar }, // Změněno na /cinnosti
  ]

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm">
      <div className="glass-panel p-2 rounded-2xl flex justify-around items-center gap-1 shadow-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl">
        {links.map((link) => {
          const isActive = path === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`relative flex-1 py-3 rounded-xl flex flex-col items-center justify-center transition-all duration-300 group ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-blue-600 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] -z-10 animate-fadeIn"></div>
              )}
              <link.icon className={`w-6 h-6 mb-1 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Navbar