import { createClient } from '@supabase/supabase-js'

// 1. Jdi na https://supabase.com/dashboard/project/_/settings/api
// 2. Zkopíruj "Project URL" a vlož ji do první uvozovky
const supabaseUrl = 'https://zjbmukwbdqttsnqukrof.supabase.co'

// 3. Zkopíruj "anon public" klíč a vlož ho do druhé uvozovky
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYm11a3diZHF0dHNucXVrcm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc2NDgsImV4cCI6MjA4MTQyMzY0OH0.McTRjUtFXLljqEm2d9TCVnITBbyILAVHRWW-7gMFZzA'

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
        } catch (e) {
            return null
        }
    },
    setItem: (key, value) => {
        try {
            getStorage().setItem(key, value)
        } catch (e) { }
    },
    removeItem: (key) => {
        try { localStorage.removeItem(key) } catch (e) { }
        try { sessionStorage.removeItem(key) } catch (e) { }
    }
}

export const setAuthPersist = (remember) => {
    try {
        localStorage.setItem(AUTH_PERSIST_KEY, remember ? 'local' : 'session')
        if (!remember) {
            localStorage.removeItem(AUTH_STORAGE_KEY)
        }
    } catch (e) { }
}

export const clearAuthStorage = () => {
    try { localStorage.removeItem(AUTH_PERSIST_KEY) } catch (e) { }
    try { localStorage.removeItem(AUTH_STORAGE_KEY) } catch (e) { }
    try { sessionStorage.removeItem(AUTH_STORAGE_KEY) } catch (e) { }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storageKey: AUTH_STORAGE_KEY,
        storage: storageAdapter,
        persistSession: true,
        autoRefreshToken: true
    }
})
