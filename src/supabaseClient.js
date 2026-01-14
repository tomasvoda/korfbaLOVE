import { createClient } from '@supabase/supabase-js'

// Preferuj načtení z .env, ale nech fallbacky pro lokální vývoj
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://zjbmukwbdqttsnqukrof.supabase.co'
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYm11a3diZHF0dHNucXVrcm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc2NDgsImV4cCI6MjA4MTQyMzY0OH0.McTRjUtFXLljqEm2d9TCVnITBbyILAVHRWW-7gMFZzA'

export const AUTH_STORAGE_KEY = 'korfbal-auth'
export const AUTH_PERSIST_KEY = 'auth_persist'

const getPersistPreference = () => {
    if (typeof localStorage === 'undefined') return 'local'
    return localStorage.getItem(AUTH_PERSIST_KEY) || 'local'
}

const getStorage = () => (getPersistPreference() === 'session' ? sessionStorage : localStorage)

const storageAdapter = {
    getItem: (key) => {
        try {
            return getStorage().getItem(key)
        } catch {
            return null
        }
    },
    setItem: (key, value) => {
        try {
            getStorage().setItem(key, value)
        } catch {
            // Ignoruj např. blokovaný storage
        }
    },
    removeItem: (key) => {
        // Odstraníme jen konkrétní klíč, ne celý storage
        try { localStorage.removeItem(key) } catch {}
        try { sessionStorage.removeItem(key) } catch {}
    }
}

export const setAuthPersist = (remember) => {
    try {
        localStorage.setItem(AUTH_PERSIST_KEY, remember ? 'local' : 'session')
        if (!remember) {
            localStorage.removeItem(AUTH_STORAGE_KEY)
        }
    } catch {
        // nic – jen nemáme „remember me“
    }
}

export const clearAuthStorage = () => {
    try { localStorage.removeItem(AUTH_PERSIST_KEY) } catch {}
    try { localStorage.removeItem(AUTH_STORAGE_KEY) } catch {}
    try { sessionStorage.removeItem(AUTH_STORAGE_KEY) } catch {}
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storageKey: AUTH_STORAGE_KEY,
        storage: storageAdapter,
        persistSession: true,
        autoRefreshToken: true
    }
})
