import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get counts for different asset types
    const [pcCount, laptopCount, printerCount, licenseCount, warehouseCount] = await Promise.all([
      db.pC.count({ where: { tenantId: user.tenantId } }),
      db.laptop.count({ where: { tenantId: user.tenantId } }),
      db.printer.count({ where: { tenantId: user.tenantId } }),
      db.license.count({ where: { tenantId: user.tenantId } }),
      db.warehouseIT.count({ where: { tenantId: user.tenantId } })
    ])

    // Get status breakdown for PCs
    const pcStatusBreakdown = await db.pC.groupBy({
      by: ['status'],
      where: { tenantId: user.tenantId },
      _count: true
    })

    // Get status breakdown for Laptops
    const laptopStatusBreakdown = await db.laptop.groupBy({
      by: ['status'],
      where: { tenantId: user.tenantId },
      _count: true
    })

    // Get recent activities (last 5 history records)
    const recentActivities = await db.history.findMany({
      where: { tenantId: user.tenantId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    return new Response(JSON.stringify({
      assets: {
        total: pcCount + laptopCount + printerCount + licenseCount + warehouseCount,
        pc: pcCount,
        laptop: laptopCount,
        printer: printerCount,
        license: licenseCount,
        warehouse: warehouseCount
      },
      statusBreakdown: {
        pc: pcStatusBreakdown,
        laptop: laptopStatusBreakdown
      },
      recentActivities
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}