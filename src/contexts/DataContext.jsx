import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const DataContext = createContext()

export function DataProvider({ children }) {
    const [osoby, setOsoby] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastFetch, setLastFetch] = useState(0) // Kdy jsme naposledy stahovali data

    // Funkce pro stažení dat (inteligentní - nestahuje, pokud má čerstvá data)
    const fetchOsoby = async (force = false) => {
        const now = Date.now()
        // Pokud máme data a uběhlo méně než 60 sekund od posledního stažení, nestahujeme znovu (pokud není force)
        if (!force && osoby.length > 0 && (now - lastFetch < 60000)) {
            return // Použijeme data z paměti -> OKAMŽITÉ ZOBRAZENÍ
        }

        if (osoby.length === 0) setLoading(true) // Loading ukazujeme jen poprvé

        const { data, error } = await supabase
            .from('osoby')
            .select('*, licence(*), kluby(nazev)')
            .order('prijmeni')

        if (!error && data) {
            setOsoby(data)
            setLastFetch(now)
        }
        setLoading(false)
    }

    // Prvotní načtení
    useEffect(() => {
        fetchOsoby()
    }, [])

    return (
        <DataContext.Provider value={{ osoby, loading, fetchOsoby }}>
            {children}
        </DataContext.Provider>
    )
}

export const useData = () => useContext(DataContext)