import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://zjbmukwbdqttsnqukrof.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYm11a3diZHF0dHNucXVrcm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc2NDgsImV4cCI6MjA4MTQyMzY0OH0.McTRjUtFXLljqEm2d9TCVnITBbyILAVHRWW-7gMFZzA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const raw = fs.readFileSync('raw_evidence.txt', 'utf8')
    const lines = raw.split('\n')
    const headers = lines[0].split('\t')
    const dataRecords = lines.slice(1)

    console.log(`Clearing existing licenses...`)
    const { error: clearError } = await supabase.from('licence').delete().gt('id', 0)
    if (clearError) {
        console.error('Error clearing licenses:', clearError.message)
        return
    }

    console.log(`Processing ${dataRecords.length} records...`)

    for (const line of dataRecords) {
        if (!line.trim()) continue
        const cols = line.split('\t')

        const name = cols[0]?.trim()
        const email = cols[1]?.trim()
        const vekValue = parseInt(cols[8])
        const vek = isNaN(vekValue) ? null : vekValue
        const status = cols[9]?.trim()

        // New mapping based on 19-column table
        const level = cols[17]?.trim() // "Licence k 30.6.2025"
        const issuedAt = cols[12]?.trim() // "Datum vydání licence"
        const validUntil = cols[18]?.trim() // "Aktuální platnost licence"
        const credits23_24 = parseInt(cols[14]) || 0
        const credits24_25 = parseInt(cols[15]) || 0

        if (!email || email === '-' || email === '') {
            console.log(`Skipping ${name} - no email or invalid`)
            continue
        }

        try {
            // 1. Find or Update Osoba
            const { data: osoba, error: fetchError } = await supabase
                .from('osoby')
                .select('id')
                .ilike('email', email)
                .maybeSingle()

            if (fetchError) throw fetchError

            let osobaId = osoba?.id

            if (!osobaId) {
                const names = name.split(' ')
                const { data: osobaByName } = await supabase
                    .from('osoby')
                    .select('id')
                    .eq('jmeno', names[0])
                    .eq('prijmeni', names.slice(1).join(' '))
                    .maybeSingle()

                osobaId = osobaByName?.id
            }

            if (osobaId) {
                // Update Osoba
                await supabase.from('osoby').update({
                    vek: vek,
                    status_evidence: status
                }).eq('id', osobaId)

                // 2. Insert Licence (since we cleared the table, always insert if level exists)
                if (level && level !== '-' && level !== '') {
                    const type = 'Trenér'

                    const formatDate = (dStr) => {
                        if (!dStr || dStr === '-' || dStr === '') return null
                        const parts = dStr.split('.')
                        if (parts.length === 3) {
                            return `${parts[2].trim()}-${parts[1].trim().padStart(2, '0')}-${parts[0].trim().padStart(2, '0')}`
                        }
                        return null
                    }

                    const licData = {
                        osoba_id: osobaId,
                        typ_role: type,
                        uroven: level,
                        datum_ziskani: formatDate(issuedAt),
                        platnost_do: formatDate(validUntil),
                        kredity_23_24: credits23_24,
                        kredity_24_25: credits24_25,
                        aktivni: status === 'aktivní'
                    }

                    const { error: insertError } = await supabase.from('licence').insert(licData)
                    if (insertError) throw insertError

                    console.log(`Updated ${name} (${email}) with license ${level}`)
                } else {
                    console.log(`Updated ${name} (${email}) - no license recorded`)
                }
            } else {
                console.log(`Person ${name} (${email}) not found in DB. Skipping.`)
            }
        } catch (err) {
            console.error(`Error processing ${name}:`, err.message)
        }
    }

    console.log('Import finished.')
}

run()
