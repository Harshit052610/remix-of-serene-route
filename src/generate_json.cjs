const fs = require('fs');

const data = fs.readFileSync('6accident_data.csv', 'utf8');
const lines = data.split('\n');

const headers = lines[0].split(',');
const idx = (name) => headers.indexOf(name);

const iLat = idx('Latitude');
const iLng = idx('Longitude');
const iSev = idx('Accident_Severity');
const iWea = idx('Weather_Conditions');
const iLgt = idx('Light_Conditions');
const iRdSurface = idx('Road_Surface_Conditions');
const iRdType = idx('Road_Type');
const iCas = idx('Number_of_Casualties');
const iDay = idx('Day_of_Week');
const iTime = idx('Time');
const iVeh = idx('Vehicle_Type');
const iSpd = idx('Speed_limit');

let records = [];

for (let i = 1; i < lines.length && records.length < 15000; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Quick parsing assuming no comma inside fields
    const cols = line.split(',');

    const latStr = cols[iLat];
    const lngStr = cols[iLng];

    if (!latStr || !lngStr) continue;

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    // Filter roughly for India (6 to 38 lat, 68 to 98 lng)
    if (lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
        records.push({
            id: i.toString(),
            lat,
            lng,
            severity: cols[iSev] || 'Unknown',
            weather: cols[iWea] || 'Unknown',
            light: cols[iLgt] || 'Unknown',
            road_surface: cols[iRdSurface] || 'Unknown',
            road_type: cols[iRdType] || 'Unknown',
            casualties: parseInt(cols[iCas] || '0', 10),
            day: cols[iDay] || 'Unknown',
            time: cols[iTime] || 'Unknown',
            vehicle: cols[iVeh] || 'Unknown',
            speed_limit: parseInt(cols[iSpd] || '0', 10)
        });
    }
}

fs.writeFileSync('../public/ap_accidents.json', JSON.stringify(records));
console.log('✅ Generated ap_accidents.json with', records.length, 'records.');
