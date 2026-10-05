export type Category = 'Computing' | 'Server' | 'Storage' | 'Networking' | 'HVAC' | 'Lighting' | 'Other'
export type DataSource = 'DEMO' | 'USER INPUT' | 'COLLEGE DATA'

export type Building = { id: string; name: string; area: number }
// Add variation to the type
export type EnergyReading = {
  id: string;
  date: string;
  buildingId: string;
  building: string;
  room: string;
  category: Category
  asset: string;
  powerWatts: number;
  quantity: number;
  operatingHours: number;
  utilization: number
  activeHours: number;
  idleHours: number;
  age: number; source: DataSource;
  notes?: string;
  variation?: number; // <--- ADD THIS
}
export type Settings = {
  tariff: number;
  emissionFactor: number;
  operatingDays: number;
  lowUtilization: number;
  idleThreshold: number;
  oldAssetYears: number
}

export const categories: Category[] = ['Computing', 'Server', 'Storage', 'Networking', 'HVAC', 'Lighting', 'Other']
export const buildings: Building[] = [
  { id: 'computer-center', name: 'Computer Center', area: 4200 }, { id: 'academic', name: 'Academic Block', area: 8200 },
  { id: 'administration', name: 'Administration Block', area: 3600 }, { id: 'library', name: 'Central Library', area: 5600 },
  { id: 'laboratory', name: 'Laboratory Block', area: 7300 }, { id: 'hostel-a', name: 'Hostel A', area: 6900 }, 
  { id: 'hostel-b', name: 'Hostel B', area: 6400 },
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

export function calculateEnergy(reading: Pick<EnergyReading, 'powerWatts' | 'quantity' | 'operatingHours'>, days = 1) {
  return reading.powerWatts * reading.quantity * reading.operatingHours * days / 1000
}
export function calculateCost(kwh: number, settings: Settings) {
  return kwh * settings.tariff
}
export function calculateCarbon(kwh: number, settings: Settings) {
  return kwh * settings.emissionFactor
}
export function readingEnergy(reading: EnergyReading, settings: Settings) {
  return calculateEnergy(reading, settings.operatingDays) * ('variation' in reading ? Number((reading as EnergyReading & { variation?: number }).variation ?? 1) : 1)
}
export function calculateMetrics(readings: EnergyReading[], settings: Settings) {
  const totalEnergy = readings.reduce((sum, reading) => sum + readingEnergy(reading, settings), 0)
  const potentialSavings = readings.reduce((sum, reading) => sum + (reading.utilization < settings.lowUtilization && reading.operatingHours > 6 ? readingEnergy(reading, settings) * 0.2 : 0), 0)
  const itEnergy = readings.filter(r => ['Computing', 'Server', 'Storage', 'Networking'].includes(r.category)).reduce((s, r) => s + readingEnergy(r, settings), 0)
  return { totalEnergy, cost: calculateCost(totalEnergy, settings), carbon: calculateCarbon(totalEnergy, settings), potentialSavings, pue: itEnergy ? totalEnergy / itEnergy : 1, dcie: totalEnergy ? itEnergy / totalEnergy * 100 : 0, intensity: totalEnergy / buildings.reduce((s, b) => s + b.area, 0), itEnergy }
}
export type WastageIssue = { id: string; 
  type: string; 
  reading: EnergyReading; 
  evidence: string; 
  saving: number; 
  severity: 'High' | 'Medium' | 'Low'; 
  action: string; rule: string 
}
export function detectWastage(
  readings: EnergyReading[],
  settings: Settings
): WastageIssue[] {
  const issues: WastageIssue[] = []

  // Ignore synthetic DEMO records for wastage detection
  const actualReadings = readings.filter((r) => r.source !== 'DEMO')

  // ---------------------------------------------------------
  // RULE 1: LOW UTILIZATION + LONG RUNTIME
  // ---------------------------------------------------------
  for (const r of actualReadings) {
    const energy = readingEnergy(r, settings)

    if (
      r.utilization < settings.lowUtilization &&
      r.operatingHours > 6
    ) {
      issues.push({
        id: `${r.id}-low-utilization`,
        type: 'Low utilization / excess runtime',
        reading: r,
        evidence: `Utilization ${r.utilization}% with ${r.operatingHours} operating hours/day`,
        saving: energy * 0.20,
        severity:
          r.utilization < settings.idleThreshold
            ? 'High'
            : 'Medium',
        action:
          'Enable automatic sleep mode and reduce unnecessary operating hours.',
        rule: `Utilization < ${settings.lowUtilization}% AND operating hours > 6`,
      })
    }

    // ---------------------------------------------------------
    // RULE 2: EXCESSIVE IDLE / STANDBY TIME
    // ---------------------------------------------------------
    if (r.idleHours > 3) {
      issues.push({
        id: `${r.id}-idle`,
        type: 'Excessive idle / standby time',
        reading: r,
        evidence: `${r.idleHours} idle/standby hours reported per day`,
        saving: energy * 0.12,
        severity: r.idleHours > 6 ? 'High' : 'Medium',
        action:
          'Enable automatic shutdown or sleep after prolonged inactivity.',
        rule: 'Idle / standby hours > 3',
      })
    }

    // ---------------------------------------------------------
    // RULE 3: EXCESSIVE OPERATING HOURS
    // ---------------------------------------------------------
    if (r.operatingHours > 12) {
      issues.push({
        id: `${r.id}-runtime`,
        type: 'Excessive operating hours',
        reading: r,
        evidence: `${r.operatingHours} operating hours/day detected`,
        saving: energy * 0.10,
        severity: r.operatingHours > 18 ? 'High' : 'Medium',
        action:
          'Review operating schedules and switch equipment off when it is not required.',
        rule: 'Operating hours > 12 hours/day',
      })
    }

    // ---------------------------------------------------------
    // RULE 4: HIGH POWER + LOW UTILIZATION
    // ---------------------------------------------------------
    if (
      r.powerWatts > 150 &&
      r.utilization < 40 &&
      r.operatingHours > 6
    ) {
      issues.push({
        id: `${r.id}-high-power-low-use`,
        type: 'High power consumption with low utilization',
        reading: r,
        evidence:
          `${r.powerWatts}W rated power with only ` +
          `${r.utilization}% utilization`,
        saving: energy * 0.15,
        severity:
          r.powerWatts > 250 && r.utilization < 25
            ? 'High'
            : 'Medium',
        action:
          'Evaluate power-efficient alternatives, consolidation, or workload scheduling.',
        rule:
          'Rated power > 150W AND utilization < 40% AND operating hours > 6',
      })
    }

    // ---------------------------------------------------------
    // RULE 5: ACTIVE HOURS MUCH LOWER THAN OPERATING HOURS
    // ---------------------------------------------------------
    if (
      r.operatingHours > 6 &&
      r.activeHours > 0 &&
      r.activeHours < r.operatingHours * 0.5
    ) {
      issues.push({
        id: `${r.id}-active-gap`,
        type: 'Large active-time gap',
        reading: r,
        evidence:
          `${r.operatingHours} operating hours but only ` +
          `${r.activeHours} active hours`,
        saving: energy * 0.10,
        severity:
          r.activeHours < r.operatingHours * 0.25
            ? 'High'
            : 'Medium',
        action:
          'Align equipment power schedules with actual usage periods.',
        rule:
          'Active hours < 50% of operating hours AND operating hours > 6',
      })
    }

    // ---------------------------------------------------------
    // RULE 6: OLD / LEGACY HIGH-ENERGY EQUIPMENT
    // ---------------------------------------------------------
    if (
      r.age > settings.oldAssetYears &&
      r.powerWatts > 120 &&
      energy > 5000
    ) {
      issues.push({
        id: `${r.id}-old`,
        type: 'Potential legacy equipment concern',
        reading: r,
        evidence:
          `${r.age} years old, ${r.powerWatts}W rated power, ` +
          `and ${energy.toFixed(1)} kWh calculated monthly energy`,
        saving: energy * 0.08,
        severity:
          r.age > settings.oldAssetYears + 3
            ? 'High'
            : 'Low',
        action:
          'Investigate replacement with energy-efficient equipment or optimize its operating schedule.',
        rule:
          `Asset age > ${settings.oldAssetYears} years ` +
          `AND rated power > 120W AND energy > 5000 kWh`,
      })
    }
  }

  // Prevent the page from being overloaded
  return issues.slice(0, 24)
}
export function formatMetric(value: number) {
  return Math.round(value).toLocaleString('en-IN')
}

export function exportReadingsCsv(readings: EnergyReading[]) {
  const headers = ['Date', 'Building', 'Room', 'Category', 'Power (W)', 'Quantity', 'Hours', 'Utilization (%)', 'Energy (kWh)', 'Source']
  const rows = readings.map(r => [r.date, r.building, r.room, r.category, r.powerWatts, r.quantity, r.operatingHours, r.utilization, calculateEnergy(r, defaultSettings.operatingDays).toFixed(1), r.source])
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export function createUserReading(input: Omit<EnergyReading, 'id' | 'source' | 'buildingId'>): EnergyReading {
  const building = buildings.find(b => b.name === input.building) ?? buildings[0]
  return { ...input, id: `user-${Date.now()}`, source: 'USER INPUT', buildingId: building.id }
}
// Note: synthetic data intentionally remains local-first so the app is usable without physical meters. The exported types and 
// centralized functions make replacing the repository with Supabase/CSV data straightforward.
