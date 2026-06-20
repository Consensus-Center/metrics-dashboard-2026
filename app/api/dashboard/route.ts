import { NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/getDashboardData'

// pg needs the Node.js runtime (not Edge), and the data should never be cached
// at the route level — it reflects live database state.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getDashboardData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[api/dashboard] query failed:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 },
    )
  }
}
