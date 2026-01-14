import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zjbmukwbdqttsnqukrof.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYm11a3diZHF0dHNucXVrcm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc2NDgsImV4cCI6MjA4MTQyMzY0OH0.McTRjUtFXLljqEm2d9TCVnITBbyILAVHRWW-7gMFZzA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    const { data: cols, error } = await supabase
        .from('licence')
        .select('*')
        .limit(0) // Just to trigger schema fetch or similar

    // Since select * might fail if column is missing but we want to know what IS there
    // We can try to fetch a single known column if any
    const { data: persons, error: pError } = await supabase.from('osoby').select('*').limit(1)
    console.log('Osoby columns:', Object.keys(persons?.[0] || {}))

    const { data: licences, error: lError } = await supabase.from('licence').select('id, osoba_id').limit(1)
    if (lError) {
        console.log('Licence basic select error:', lError.message)
    } else {
        console.log('Licence basic data:', licences)
    }

    // Try to get all columns via a generic select
    const { data: allLic, error: allErr } = await supabase.from('licence').select().limit(1)
    if (allErr) {
        console.log('Licence all column select error:', allErr.message)
    } else {
        console.log('Licence columns:', Object.keys(allLic?.[0] || {}))
    }
}

checkSchema()
