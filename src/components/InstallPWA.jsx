import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom' // Důležitý import pro "vynesení" okna ven
import { Download, X, Share, PlusSquare } from 'lucide-react'

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showIosInstructions, setShowIosInstructions] = useState(false)
    const [isIos, setIsIos] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase()
        const ios = /iphone|ipad|ipod/.test(userAgent)
        setIsIos(ios)

        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
        setIsStandalone(isInStandaloneMode)

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }, [])

    if (isStandalone) return null

    const handleInstallClick = async () => {
        if (isIos) {
            setShowIosInstructions(true)
        } else if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setDeferredPrompt(null)
            }
        }
    }

    if (!deferredPrompt && !isIos) return null

    // Obsah modálu oddělíme do proměnné
    const modalContent = (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm animate-fadeIn" 
            onClick={() => setShowIosInstructions(false)}
            style={{ height: '100dvh' }} // Dynamická výška pro mobily
        >
            <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 bg-[#0f172a] relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowIosInstructions(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2">
                    <X className="w-6 h-6"/>
                </button>
                
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-white/10">
                        <Download className="w-8 h-8 text-blue-500"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Instalace na iOS</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Aplikaci nainstalujete na plochu vašeho iPhonu ve dvou krocích:</p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <Share className="w-6 h-6 text-blue-400 shrink-0"/>
                        <div className="text-sm text-slate-300">1. Klikněte na tlačítko <span className="font-bold text-white">Sdílet</span> v dolní liště.</div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <PlusSquare className="w-6 h-6 text-slate-200 shrink-0"/>
                        <div className="text-sm text-slate-300">2. Vyberte <span className="font-bold text-white">Přidat na plochu</span>.</div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button onClick={() => setShowIosInstructions(false)} className="text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-white transition-colors">
                        Zavřít návod
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Tlačítko zůstává v menu */}
            <button 
                onClick={handleInstallClick} 
                className="p-2 rounded-full transition-all duration-300 flex flex-col items-center justify-center relative group text-green-400 hover:text-green-300 animate-pulse"
                title="Stáhnout aplikaci"
            >
                <Download className="w-6 h-6"/>
            </button>

            {/* Modál "teleportujeme" přímo do body stránky, mimo navbar */}
            {showIosInstructions && createPortal(modalContent, document.body)}
        </>
    )
}