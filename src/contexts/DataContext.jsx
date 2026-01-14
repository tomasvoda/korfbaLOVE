import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'

const DataContext = createContext()

export function DataProvider({ children }) {
    const [osoby, setOsoby] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastFetch, setLastFetch] = useState(0)
    const [error, setError] = useState(null)
    const osobaCacheRef = useRef({}) // Cache for detailed person data using Ref to prevent infinite loops

    const fetchOsoby = async (force = false) => {
        const now = Date.now()
        if (!force && osoby.length > 0 && (now - lastFetch < 60000)) return

        if (osoby.length === 0) setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase
                .from('osoby')
                .select('*, licence(*), kluby(nazev)')
                .order('prijmeni')

            if (error) throw error
            if (data) {
                setOsoby(data)
                setLastFetch(now)
            }
        } catch (e) {
            console.error(e)
            setError(e.message || 'Nepodařilo se načíst seznam osob.')
        } finally {
            setLoading(false)
        }
    }

    const fetchOsobaDetail = useCallback(async (id, force = false) => {
        const now = Date.now()
        const cached = osobaCacheRef.current[id]

        if (!force && cached && (now - cached.timestamp < 30000)) {
            return cached.data
        }

        try {
            const { data, error } = await supabase
                .from('osoby')
                .select('*, licence(*), cinnosti(*), aktivity(*), kluby(nazev)')
                .eq('id', id)
                .maybeSingle()

            if (error) throw error
            if (data) {
                osobaCacheRef.current[id] = { data, timestamp: Date.now() }
                return data
            }
            return null
        } catch (e) {
            console.error('Chyba detailu:', e)
            throw e
        }
    }, [])

    const invalidateOsoba = useCallback((id) => {
        delete osobaCacheRef.current[id]
    }, [])

    useEffect(() => { fetchOsoby() }, [])

    return (
        <DataContext.Provider value={{ osoby, loading, error, fetchOsoby, fetchOsobaDetail, invalidateOsoba }}>
            {children}
        </DataContext.Provider>
    )
}

export const useData = () => useContext(DataContext)