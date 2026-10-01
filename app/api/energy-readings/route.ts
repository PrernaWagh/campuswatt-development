import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET: fetch all readings from Supabase
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('energy_readings')
      .select('*, buildings(name)')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    // Normalize to match your EnergyReading type
    const readings = (data ?? []).map((row: any) => ({
      id: row.id,
      date: row.reading_date,
      buildingId: row.building_id,
      building: row.buildings?.name ?? 'Unknown',
      room: row.room_name,
      category: row.category,
      asset: row.asset ?? '',
      powerWatts: Number(row.power_watts),
      quantity: Number(row.quantity),
      operatingHours: Number(row.operating_hours),
      utilization: Number(row.utilization),
      activeHours: Number(row.active_hours),
      idleHours: Number(row.idle_hours),
      age: Number(row.asset_age),
      source: row.source,
      notes: row.notes ?? '',
    }))

    return NextResponse.json({ readings })
  } catch (error: any) {
    console.error('GET /api/energy-readings error:', error)
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch readings' },
      { status: 500 }
    )
  }
}

// POST: save a new reading
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    if (!body.buildingName) {
      return NextResponse.json({ error: 'Building is required' }, { status: 400 })
    }
    if (body.powerWatts < 0 || body.quantity <= 0 || body.operatingHours < 0 || body.operatingHours > 24) {
      return NextResponse.json({ error: 'Invalid numeric values' }, { status: 400 })
    }
    if (body.utilization < 0 || body.utilization > 100) {
      return NextResponse.json({ error: 'Utilization must be 0-100' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Look up building ID
    const { data: building, error: bErr } = await supabase
      .from('buildings')
      .select('id')
      .eq('name', body.buildingName)
      .single()

    if (bErr || !building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 400 })
    }

    // Insert reading
    const { data, error } = await supabase
      .from('energy_readings')
      .insert({
        building_id: building.id,
        room_name: body.room || 'Unspecified',
        category: body.category,
        asset: body.asset,
        power_watts: body.powerWatts,
        quantity: body.quantity,
        operating_hours: body.operatingHours,
        operating_days: body.operatingDays ?? 26,
        utilization: body.utilization,
        active_hours: body.activeHours,
        idle_hours: body.idleHours,
        asset_age: body.age,
        reading_date: body.date,
        source: 'COLLEGE DATA',
        notes: body.notes,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id, success: true })
  } catch (error: any) {
    console.error('POST /api/energy-readings error:', error)
    return NextResponse.json(
      { error: error.message ?? 'Failed to save reading' },
      { status: 500 }
    )
  }
}