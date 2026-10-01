export type Category = 'Computing' | 'Server' | 'Storage' | 'Networking' | 'HVAC' | 'Lighting' | 'Other'
export type DataSource = 'DEMO' | 'USER INPUT' | 'COLLEGE DATA'

export type Building = { id: string; name: string; area: number }
// Add variation to the type
export type EnergyReading = {
  id: string; date: string; buildingId: string; building: string; room: string; category: Category
  asset: string; powerWatts: number; quantity: number; operatingHours: number; utilization: number
  activeHours: number; idleHours: number; age: number; source: DataSource; notes?: string;
  variation?: number; // <--- ADD THIS
}
export type Settings = { tariff: number; emissionFactor: number; operatingDays: number; lowUtilization: number; idleThreshold: number; oldAssetYears: number }

export const categories: Category[] = ['Computing', 'Server', 'Storage', 'Networking', 'HVAC', 'Lighting', 'Other']
export const buildings: Building[] = [
  { id: 'computer-center', name: 'Computer Center', area: 4200 }, { id: 'academic', name: 'Academic Block', area: 8200 },
  { id: 'administration', name: 'Administration Block', area: 3600 }, { id: 'library', name: 'Central Library', area: 5600 },
  { id: 'laboratory', name: 'Laboratory Block', area: 7300 }, { id: 'hostel-a', name: 'Hostel A', area: 6900 }, { id: 'hostel-b', name: 'Hostel B', area: 6400 },
]
export const defaultSettings: Settings = { tariff: 10, emissionFactor: 0.82, operatingDays: 26, lowUtilization: 30, idleThreshold: 20, oldAssetYears: 5 }

const seedTemplates = [
  ['Computer Center', 'Computer Lab 1', 'Computing', 'Desktop Systems', 150, 60, 9, 24, 8, 1], ['Computer Center', 'Computer Lab 2', 'Computing', 'Desktop Systems', 150, 48, 9, 18, 8, 2],
  ['Computer Center', 'Main Server Room', 'Server', 'Server Cluster', 650, 8, 24, 68, 24, 4], ['Academic Block', 'Lecture Hall A', 'Lighting', 'LED Lighting', 80, 42, 7, 72, 7, 3],
  ['Academic Block', 'Lecture Hall A', 'HVAC', 'HVAC System', 1800, 4, 8, 64, 8, 6], ['Administration Block', 'Office Floor', 'Computing', 'Office Workstations', 120, 32, 8, 52, 7, 5],
  ['Central Library', 'Reading Hall', 'Lighting', 'Library Lighting', 70, 90, 12, 58, 10, 4], ['Central Library', 'Network Room', 'Networking', 'Network Equipment', 220, 12, 18, 38, 10, 3],
  ['Laboratory Block', 'Research Lab', 'HVAC', 'HVAC System', 2100, 5, 10, 76, 10, 2], ['Laboratory Block', 'Research Lab', 'Computing', 'Lab Workstations', 180, 36, 8, 44, 7, 7],
  ['Hostel A', 'Residential Floor', 'Other', 'Common Area', 240, 14, 10, 64, 8, 4], ['Hostel B', 'Residential Floor', 'Other', 'Common Area', 240, 12, 10, 59, 8, 4],
] as const

export function createDemoReadings(): EnergyReading[] {
  return Array.from({ length: 30 }, (_, day) => seedTemplates.map((row, index): EnergyReading => {
    const [building, room, category, asset, powerWatts, quantity, hours, utilization, activeHours, age] = row
    const variation = 0.88 + ((day * 7 + index * 3) % 25) / 100
    return { 
      id: `demo-${day}-${index}`, 
      date: new Date(Date.now() - day * 86400000).toISOString().slice(0, 10), 
      buildingId: buildings.find(b => b.name === building)!.id, 
      building, room, category, asset, powerWatts, quantity, operatingHours: hours, 
      utilization, activeHours, idleHours: Math.max(0, hours - activeHours), age, 
      source: 'DEMO' as const, 
      notes: 'Synthetic campus demonstration reading', 
      variation // Now valid
    }
  })).flat()
}

export function calculateEnergy(reading: Pick<EnergyReading, 'powerWatts' | 'quantity' | 'operatingHours'>, days = 1) { return reading.powerWatts * reading.quantity * reading.operatingHours * days / 1000 }
export function calculateCost(kwh: number, settings: Settings) { return kwh * settings.tariff }
export function calculateCarbon(kwh: number, settings: Settings) { return kwh * settings.emissionFactor }
export function readingEnergy(reading: EnergyReading, settings: Settings) { return calculateEnergy(reading, settings.operatingDays) * ('variation' in reading ? Number((reading as EnergyReading & { variation?: number }).variation ?? 1) : 1) }
export function calculateMetrics(readings: EnergyReading[], settings: Settings) {
  const totalEnergy = readings.reduce((sum, reading) => sum + readingEnergy(reading, settings), 0)
  const potentialSavings = readings.reduce((sum, reading) => sum + (reading.utilization < settings.lowUtilization && reading.operatingHours > 6 ? readingEnergy(reading, settings) * 0.2 : 0), 0)
  const itEnergy = readings.filter(r => ['Computing', 'Server', 'Storage', 'Networking'].includes(r.category)).reduce((s, r) => s + readingEnergy(r, settings), 0)
  return { totalEnergy, cost: calculateCost(totalEnergy, settings), carbon: calculateCarbon(totalEnergy, settings), potentialSavings, pue: itEnergy ? totalEnergy / itEnergy : 1, dcie: totalEnergy ? itEnergy / totalEnergy * 100 : 0, intensity: totalEnergy / buildings.reduce((s, b) => s + b.area, 0), itEnergy }
}
export type WastageIssue = { id: string; type: string; reading: EnergyReading; evidence: string; saving: number; severity: 'High' | 'Medium' | 'Low'; action: string; rule: string }
export function detectWastage(readings: EnergyReading[], settings: Settings): WastageIssue[] {
  return readings.filter(r => r.source === 'USER INPUT' || r.date === readings[0]?.date).flatMap((r, i) => {
    const issues: WastageIssue[] = []; const energy = readingEnergy(r, settings)
    if (r.utilization < settings.lowUtilization && r.operatingHours > 6) issues.push({ id: `${r.id}-low`, type: 'Low utilization / excess runtime', reading: r, evidence: `Utilization ${r.utilization}% with ${r.operatingHours} operating hours/day`, saving: energy * 0.2, severity: r.utilization < settings.idleThreshold ? 'High' : 'Medium', action: 'Enable automatic sleep mode and reduce idle operating hours.', rule: `Utilization < ${settings.lowUtilization}% AND operating hours > 6` })
    if (r.idleHours > 3) issues.push({ id: `${r.id}-idle`, type: 'Idle equipment running', reading: r, evidence: `${r.idleHours} idle/standby hours reported`, saving: energy * 0.12, severity: 'Medium', action: 'Schedule automatic shutdown after campus operating hours.', rule: 'Idle / standby hours > 3' })
    if (r.age > settings.oldAssetYears && energy > 5000) issues.push({ id: `${r.id}-old`, type: 'Potential legacy equipment concern', reading: r, evidence: `${r.age} years old and high calculated energy use`, saving: energy * 0.08, severity: 'Low', action: 'Investigate replacement or optimization; age alone does not prove inefficiency.', rule: `Asset age > ${settings.oldAssetYears} years AND high energy use` })
    return issues
  }).slice(0, 16)
}
export function formatMetric(value: number) { return Math.round(value).toLocaleString('en-IN') }

export function exportReadingsCsv(readings: EnergyReading[]) {
  const headers = ['Date','Building','Room','Category','Power (W)','Quantity','Hours','Utilization (%)','Energy (kWh)','Source']
  const rows = readings.map(r => [r.date, r.building, r.room, r.category, r.powerWatts, r.quantity, r.operatingHours, r.utilization, calculateEnergy(r, defaultSettings.operatingDays).toFixed(1), r.source])
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export function createUserReading(input: Omit<EnergyReading, 'id' | 'source' | 'buildingId'>): EnergyReading {
  const building = buildings.find(b => b.name === input.building) ?? buildings[0]
  return { ...input, id: `user-${Date.now()}`, source: 'USER INPUT', buildingId: building.id }
}
// Note: synthetic data intentionally remains local-first so the app is usable without physical meters. The exported types and centralized functions make replacing the repository with Supabase/CSV data straightforward.
