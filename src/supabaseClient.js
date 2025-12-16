import { createClient } from '@supabase/supabase-js'

// 1. Jdi na https://supabase.com/dashboard/project/_/settings/api
// 2. Zkopíruj "Project URL" a vlož ji do první uvozovky
const supabaseUrl = 'https://zjbmukwbdqttsnqukrof.supabase.co'

// 3. Zkopíruj "anon public" klíč a vlož ho do druhé uvozovky
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYm11a3diZHF0dHNucXVrcm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc2NDgsImV4cCI6MjA4MTQyMzY0OH0.McTRjUtFXLljqEm2d9TCVnITBbyILAVHRWW-7gMFZzA'

export const supabase = createClient(supabaseUrl, supabaseKey)