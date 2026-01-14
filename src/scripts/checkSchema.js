import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zjbmukwbdqttsnqukrof.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYm11a3diZHF0dHNucXVrcm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc2NDgsImV4cCI6MjA4MTQyMzY0OH0.McTRjUtFXLljqEm2d9TCVnITBbyILAVHRWW-7gMFZzA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    const { data, error } = await supabase.from('licence').select('*').limit(1)
    if (error) {
        console.error('Error fetching licence:', error.message)
    } else {
        console.log('Columns in licence table:', Object.keys(data[0] || {}))
    }
}

checkSchema()
