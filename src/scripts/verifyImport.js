import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zjbmukwbdqttsnqukrof.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYm11a3diZHF0dHNucXVrcm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc2NDgsImV4cCI6MjA4MTQyMzY0OH0.McTRjUtFXLljqEm2d9TCVnITBbyILAVHRWW-7gMFZzA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyImport() {
    const { data: records, error } = await supabase
        .from('licence')
        .select('*, osoby(jmeno, prijmeni, email)')
        .limit(5)

    if (error) {
        console.error('Error verifying import:', error.message)
    } else {
        console.log('Sample imported licenses with credits:')
        records.forEach(r => {
            console.log(`- ${r.osoby.jmeno} ${r.osoby.prijmeni}: Level ${r.uroven}`)
            console.log(`  - 23/24: ${r.kredity_23_24}, 24/25: ${r.kredity_24_25}`)
        })
    }
}

verifyImport()
