import { generovatTerminy, getRenewalPeriod, getLicenseTargets } from './dateUtils';

/**
 * Calculates current and projected credits for a license based on activities and trainings.
 * @param {Object} licence - The license object.
 * @param {Array} cinnosti - List of repetitive activities (trainings).
 * @param {Array} aktivityList - List of one-off activities (matches, etc.).
 * @returns {Object} Stats including current, projected, and required credits.
 */
export const calculateLicenseStats = (licence, cinnosti = [], aktivityList = []) => {
    if (!licence) return { current: 0, projected: 0, req: 150 };

    const { start: renewalStart, end: renewalEnd } = getRenewalPeriod(licence.platnost_do);
    const targets = getLicenseTargets(licence.uroven);
    const isTrenerska = licence.typ_role === 'Trenér';

    const isEligible = (datumStr) => {
        if (!renewalStart || !renewalEnd) return true;
        const d = new Date(datumStr);
        return d >= renewalStart && d <= renewalEnd;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initial credits from legacy snapshots for the bridge period (transition to 30.6.2026)
    // We use kredity_24_25 as the base for the 24-month evaluation ending 2026
    let aktualni = (licence.kredity_24_25 || 0);
    let predpoklad = (licence.kredity_24_25 || 0);

    const trainingDaysSet = new Set();
    const processedDates = new Set();

    // 1. Map training days and calculate training credits
    // Only count dynamic activities from season 2025/2026 onwards for the transition
    const transitionDate = new Date('2025-07-01');

    cinnosti.forEach(c => {
        if (c.role === licence.typ_role && (c.typ_aktivity === 'trenink' || !c.typ_aktivity)) {
            const terminy = generovatTerminy(c.datum_od, c.datum_do, c.den_v_tydnu, c.vynechane_datumy);
            terminy.forEach(t => {
                if (t.aktivni) {
                    trainingDaysSet.add(t.datum);
                    const tDate = new Date(t.datum);
                    if (isEligible(t.datum) && tDate >= transitionDate) {
                        const credits = c.pocet_jednotek || 1;
                        predpoklad += credits;
                        if (tDate <= today) {
                            aktualni += credits;
                        }
                    }
                }
            });
        }
    });

    // 2. Add Match / Publication / Seminar credits
    if (aktivityList && isTrenerska) {
        const eligibleActivities = aktivityList.filter(a => isEligible(a.datum) && new Date(a.datum) >= transitionDate);
        const sortedMatches = [...eligibleActivities].sort((a, b) => new Date(b.datum) - new Date(a.datum));

        sortedMatches.forEach((akt) => {
            if (akt.typ_aktivity === 'publikace' || akt.typ_aktivity === 'seminar') {
                aktualni += (akt.kredity || 0);
                predpoklad += (akt.kredity || 0);
                return;
            }

            // Shield against collision with training or other matches on the same day
            if (trainingDaysSet.has(akt.datum)) return;
            if (processedDates.has(akt.datum)) return;

            aktualni += (akt.kredity || 0);
            predpoklad += (akt.kredity || 0);
            if ((akt.kredity || 0) > 0) processedDates.add(akt.datum);
        });
    }


    return {
        current: aktualni,
        projected: predpoklad,
        req: targets.req,
        targets: targets,
        renewalStart,
        renewalEnd
    };
};

/**
 * Checks if a date is within a specific season.
 */
export const getSeasonFromDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-indexed

    if (month >= 8) {
        return `${year}/${year + 1}`;
    } else {
        return `${year - 1}/${year}`;
    }
};
