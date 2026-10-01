import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('energy_readings')
      .select('*, buildings(name)')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

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
    console.error('GET error:', error)
    return NextResponse.json({ error: error.message ?? 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/energy-readings received:', body)

    if (!body.buildingName) {
      return NextResponse.json({ error: 'Building name missing' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Step 1: Always ensure building exists
    const cleanName = String(body.buildingName).trim()
    
    // Try to find the building
    let buildingId: string | null = null
    const { data: existing } = await supabase
      .from('buildings')
      .select('id')
      .ilike('name', cleanName)
      .maybeSingle()

    if (existing?.id) {
      buildingId = existing.id
      console.log('Building found:', buildingId)
    } else {
      // Auto-create
      console.log('Building not found, creating:', cleanName)
      const { data: created, error: createErr } = await supabase
        .from('buildings')
        .insert({ name: cleanName, code: cleanName.slice(0, 3).toUpperCase(), area_sq_m: 1000 })
        .select('id')
        .single()

      if (createErr || !created) {
        console.error('Create building error:', createErr)
        return NextResponse.json(
          { error: `Could not find or create building: ${createErr?.message}` },
          { status: 500 }
        )
      }
      buildingId = created.id
      console.log('Building created:', buildingId)
    }

    // Step 2: Insert the reading
    const { data, error } = await supabase
      .from('energy_readings')
      .insert({
        building_id: buildingId,
        room_name: body.room || 'Unspecified',
        category: body.category || 'Other',
        asset: body.asset || '',
        power_watts: Number(body.powerWatts) || 0,
        quantity: Number(body.quantity) || 1,
        operating_hours: Number(body.operatingHours) || 0,
        operating_days: Number(body.operatingDays) || 26,
        utilization: Number(body.utilization) || 0,
        active_hours: Number(body.activeHours) || 0,
        idle_hours: Number(body.idleHours) || 0,
        asset_age: Number(body.age) || 0,
        reading_date: body.date,
        source: 'COLLEGE DATA',
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert reading error:', error)
      throw error
    }

    console.log('Reading saved:', data.id)
    return NextResponse.json({ id: data.id, success: true })
  } catch (error: any) {
    console.error('POST error:', error)
    return NextResponse.json({ error: error.message ?? 'Failed to save' }, { status: 500 })
  }
}