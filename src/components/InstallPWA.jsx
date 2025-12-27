import { useState, useEffect } from 'react'
import { Download, X, Share, PlusSquare } from 'lucide-react'

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showIosInstructions, setShowIosInstructions] = useState(false)
    const [isIos, setIsIos] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // 1. Detekce iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const ios = /iphone|ipad|ipod/.test(userAgent)
        setIsIos(ios)

        // 2. Detekce, zda už je aplikace nainstalovaná (Standalone mode)
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
        setIsStandalone(isInStandaloneMode)

        // 3. Zachycení události pro Android/Chrome instalaci
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }, [])

    // Pokud už je nainstalováno, nic nezobrazujeme
    if (isStandalone) return null

    const handleInstallClick = async () => {
        if (isIos) {
            // Na iOS nemůžeme instalovat programově, musíme ukázat návod
            setShowIosInstructions(true)
        } else if (deferredPrompt) {
            // Na Androidu spustíme nativní výzvu
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setDeferredPrompt(null)
            }
        }
    }

    // Pokud nemáme prompt (Android) a nejsme na iOS, tlačítko skryjeme (např. na PC v nepodporovaném prohlížeči)
    if (!deferredPrompt && !isIos) return null

    return (
        <>
            {/* TLAČÍTKO V MENU (Toto vložíme do Navbaru) */}
            <button 
                onClick={handleInstallClick} 
                className="p-2 rounded-full transition-all duration-300 flex flex-col items-center justify-center relative group text-green-400 hover:text-green-300 animate-pulse"
                title="Stáhnout aplikaci"
            >
                <Download className="w-6 h-6"/>
            </button>

            {/* MODÁL S NÁVODEM PRO iOS */}
            {showIosInstructions && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setShowIosInstructions(false)}>
                    <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 bg-[#0f172a] relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowIosInstructions(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <X className="w-6 h-6"/>
                        </button>
                        
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-white/10">
                                <Download className="w-8 h-8 text-blue-500"/>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Instalace na iOS</h3>
                            <p className="text-sm text-slate-400">Aplikaci nainstalujete na plochu vašeho iPhonu ve dvou krocích:</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <Share className="w-6 h-6 text-blue-400"/>
                                <div className="text-sm text-slate-300">1. Klikněte na tlačítko <span className="font-bold text-white">Sdílet</span> v dolní liště prohlížeče.</div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <PlusSquare className="w-6 h-6 text-slate-200"/>
                                <div className="text-sm text-slate-300">2. V menu vyberte možnost <span className="font-bold text-white">Přidat na plochu</span>.</div>
                            </div>
                        </div>

                        <div className="mt-6 text-center text-xs text-slate-500">
                            Klikněte kamkoliv pro zavření
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}