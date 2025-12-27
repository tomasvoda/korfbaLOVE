const SVATKY_FIXNI = ['1-1', '5-1', '5-8', '7-5', '7-6', '9-28', '10-28', '11-17', '12-24', '12-25', '12-26']

export const getAktualniSezona = () => {
    const dnes = new Date()
    const mesic = dnes.getMonth()
    const rok = dnes.getFullYear()
    const startRok = mesic >= 6 ? rok : rok - 1 
    const endRok = startRok + 1
    return {
        nazev: `${startRok}/${endRok}`,
        start: `${startRok}-09-01`,
        end: `${endRok}-06-30`
    }
}

export const getSezonyList = () => {
    const startRokGlobal = 2020
    const aktualni = getAktualniSezona()
    const [aktualniStart] = aktualni.nazev.split('/').map(Number)
    
    const sezony = []
    for (let rok = aktualniStart; rok >= startRokGlobal; rok--) {
        sezony.push(`${rok}/${rok+1}`)
    }
    return sezony
}

export const getLimitySezony = (sezonaNazev) => {
    if (!sezonaNazev) return { start: '', end: '' }
    const [startRok, endRok] = sezonaNazev.split('/')
    return {
        start: `${startRok}-09-01`,
        end: `${endRok}-06-30`
    }
}

export const generovatTerminy = (datumOd, datumDo, denVTydnuInput, vynechaneDatumy = []) => {
    if(!datumOd || !datumDo) return []
    
    let terminy = []
    let current = new Date(datumOd)
    const end = new Date(datumDo)
    
    // Konverze vstupu na číslo dne (0-6)
    const d = parseInt(denVTydnuInput)
    const targetDay = isNaN(d) ? 1 : (d === 7 ? 0 : d) // Default Pondělí

    // Posun na první den
    while (current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1)
    }

    while (current <= end) {
        const mesic = current.getMonth() + 1
        const den = current.getDate()
        const mesicDen = `${mesic}-${den}`
        
        const rokISO = current.getFullYear()
        const mesISO = String(mesic).padStart(2, '0')
        const denISO = String(den).padStart(2, '0')
        const isoDate = `${rokISO}-${mesISO}-${denISO}`

        let duvod = ''
        let jeSvatek = false

        if (SVATKY_FIXNI.includes(mesicDen)) { duvod = 'Státní svátek'; jeSvatek = true }
        else if ((mesic === 12 && den >= 23) || (mesic === 1 && den <= 2)) { duvod = 'Vánoční prázdniny'; jeSvatek = true }

        // Defaultně aktivní, pokud není svátek
        let aktivni = !jeSvatek
        
        // Pokud je v poli vynechaných, invertujeme stav
        const safeVynechane = Array.isArray(vynechaneDatumy) ? vynechaneDatumy : []
        const manualne = safeVynechane.includes(isoDate)
        
        if (manualne) aktivni = !aktivni

        terminy.push({
            datum: isoDate,
            aktivni: aktivni,
            duvod: duvod,
            manualne: manualne
        })

        current.setDate(current.getDate() + 7)
    }
    return terminy
}

export const vypocitatPlatnostLicence = (datumZiskaniIso) => {
    if (!datumZiskaniIso) return ''
    const datumZiskani = new Date(datumZiskaniIso)
    const hraniceLegacy = new Date('2022-12-27')
    let vychoziRok = datumZiskani.getFullYear()
    if (datumZiskani < hraniceLegacy) { vychoziRok = 2022 }
    const cilovyRok = vychoziRok + 3
    return `${cilovyRok}-06-30`
}

// --- NOVÁ FUNKCE PRO VÝPOČET KREDITŮ NA KARTU ---
export const spocitatKredityDetail = (aktivita) => {
    if (!aktivita) return { aktualni: 0, celkem: 0 }

    // 1. Vygenerujeme všechny termíny (minulé i budoucí)
    const terminy = generovatTerminy(
        aktivita.datum_od, 
        aktivita.datum_do, 
        aktivita.den_v_tydnu, 
        aktivita.vynechane_datumy
    )

    const dnes = new Date()
    dnes.setHours(0, 0, 0, 0) // Reset času pro přesné porovnání dnů

    let pocetAktualni = 0
    let pocetCelkem = 0

    terminy.forEach(t => {
        if (t.aktivni) {
            pocetCelkem++
            // Pokud termín již proběhl nebo je dnes
            if (new Date(t.datum) <= dnes) {
                pocetAktualni++
            }
        }
    })

    const jednotky = aktivita.pocet_jednotek || 1

    return {
        aktualni: pocetAktualni * jednotky,
        celkem: pocetCelkem * jednotky
    }
}