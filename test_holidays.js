const { getKoreanHolidays } = require('./lib/holidays');

console.log('--- 2025 Holidays ---');
const h2025 = getKoreanHolidays(2025);
Object.keys(h2025).sort().forEach(date => {
    console.log(`${date}: ${h2025[date].displayHolidayName}`);
});

console.log('\n--- 2026 Holidays ---');
const h2026 = getKoreanHolidays(2026);
Object.keys(h2026).sort().forEach(date => {
    console.log(`${date}: ${h2026[date].displayHolidayName}`);
});
