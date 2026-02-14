const Holidays = require('date-holidays');
const hd = new Holidays('KR');

console.log('--- 2025 Holidays (Raw) ---');
const h2025 = hd.getHolidays(2025);
h2025.forEach(h => console.log(`${h.date}: ${h.name} (${h.type})`));

console.log('\n--- 2026 Holidays (Raw) ---');
const h2026 = hd.getHolidays(2026);
h2026.forEach(h => console.log(`${h.date}: ${h.name} (${h.type})`));
