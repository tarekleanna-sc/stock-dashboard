import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('snapshots').select('date, total_value').eq('user_id', user.id).order('date')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.map((r) => ({ date: r.date, totalValue: r.total_value })) ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { totalValue } = await request.json()
  const date = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('snapshots').upsert(
    { user_id: user.id, date, total_value: totalValue },
    { onConflict: 'user_id,date' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, date })
}
