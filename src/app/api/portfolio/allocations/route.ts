import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('target_allocations').select('symbol, percentage').eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const allocations: Record<string, number> = {}
  data?.forEach((r) => { allocations[r.symbol] = r.percentage })
  return NextResponse.json(allocations)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { symbol, percentage } = await request.json()
  const { error } = await supabase.from('target_allocations').upsert(
    { user_id: user.id, symbol, percentage },
    { onConflict: 'user_id,symbol' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  if (symbol) {
    await supabase.from('target_allocations').delete().eq('user_id', user.id).eq('symbol', symbol)
  } else {
    // Clear all
    await supabase.from('target_allocations').delete().eq('user_id', user.id)
  }
  return NextResponse.json({ success: true })
}
