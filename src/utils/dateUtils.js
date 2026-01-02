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
        sezony.push(`${rok}/${rok + 1}`)
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
    if (!datumOd || !datumDo) return []

    let terminy = []
    let current = new Date(datumOd)
    const end = new Date(datumDo)

    if (isNaN(current.getTime()) || isNaN(end.getTime())) {
        return []
    }

    // Konverze vstupu na číslo dne (0-6)
    // Konverze vstupu na číslo dne (0-6)
    let d = parseInt(denVTydnuInput)
    // PATCH: Pokud den chybí (staré záznamy zápasů), odvodíme ho z datumOd
    if (isNaN(d)) {
        d = new Date(datumOd).getDay()
    }
    const targetDay = d === 7 ? 0 : d

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

// --- LOGIKA PRO OBNOVENÍ LICENCE ---
export const getRenewalPeriod = (platnostDoIso) => {
    if (!platnostDoIso) return { start: null, end: null }
    const end = new Date(platnostDoIso)
    end.setHours(23, 59, 59, 999) // Do konce dne platnosti

    // Start je "během platnosti", takže od data vydání do data platnosti?
    // Směrnice říká: "V období posledních 24 měsíců od data zániku licence"
    const start = new Date(end)
    start.setMonth(start.getMonth() - 24)
    start.setHours(0, 0, 0, 0)

    return { start, end }
}

export const getLicenseTargets = (uroven) => {
    if (uroven === 'B') return { req: 150, next: 'C', maintenance: 'B' }
    if (uroven === 'C') return { req: 100, next: 'D', maintenance: 'C' }
    if (uroven === 'D') return { req: 50, next: null, maintenance: 'D' } // Next null means loss
    return { req: 50, next: null, maintenance: 'D' } // Default
}

// --- NOVÁ FUNKCE PRO VÝPOČET KREDITŮ NA KARTU ---
export const spocitatKredityDetail = (aktivita) => {
    if (!aktivita) return { aktualni: 0, celkem: 0 }

    // 1. Publikace a Semináře (fixní hodnota)
    if (aktivita.typ_aktivity === 'publikace' || aktivita.typ_aktivity === 'seminar') {
        return { aktualni: 10, celkem: 10 }
    }

    // 2. Určení hodnoty za den podle typu
    let kredityZaDen = 1 // Default: Trénink
    if (aktivita.typ_aktivity === 'zapas_cks') kredityZaDen = 3
    if (aktivita.typ_aktivity === 'zapas_int') kredityZaDen = 5

    const dnes = new Date()
    dnes.setHours(0, 0, 0, 0)

    // 3A. ZJEDNODUŠENÁ LOGIKA PRO ZÁPASY (Jednorázové akce)
    if (aktivita.typ_aktivity === 'zapas_cks' || aktivita.typ_aktivity === 'zapas_int') {
        // Kontrola, zda není datum manuálně vyřazeno (nepravděpodobné u zápasů, ale pro konzistenci)
        const safeVynechane = Array.isArray(aktivita.vynechane_datumy) ? aktivita.vynechane_datumy : []
        if (safeVynechane.includes(aktivita.datum_od)) {
            return { aktualni: 0, celkem: 0 }
        }

        const datumZapasu = new Date(aktivita.datum_od)
        datumZapasu.setHours(0, 0, 0, 0) // Reset času pro porovnání

        return {
            aktualni: (datumZapasu <= dnes) ? kredityZaDen : 0,
            celkem: kredityZaDen
        }
    }

    // 3B. LOGIKA PRO TRÉNINKY (Opakující se)
    const terminy = generovatTerminy(
        aktivita.datum_od,
        aktivita.datum_do,
        aktivita.den_v_tydnu,
        aktivita.vynechane_datumy
    )

    let dniAktualni = 0
    let dniCelkem = 0

    terminy.forEach(t => {
        if (t.aktivni) {
            dniCelkem++
            if (new Date(t.datum) <= dnes) {
                dniAktualni++
            }
        }
    })

    // Směrnice: "1 kredit za každý den..." -> násobíme dny hodnotou
    return {
        aktualni: dniAktualni * kredityZaDen,
        celkem: dniCelkem * kredityZaDen
    }
}