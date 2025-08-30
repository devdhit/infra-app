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

    // Get department-based statistics for PC assets
    const pcDepartmentStats = await db.pC.groupBy({
      by: ['dept'],
      where: { tenantId: user.tenantId },
      _count: {
        _all: true,
        monitorBarcode: true,
        upsBarcode: true
      }
    })

    // Transform department stats to include counts for PCs, Monitors, and UPSs
    const departmentAssetStats = pcDepartmentStats.map(deptStat => ({
      department: deptStat.dept,
      pcCount: deptStat._count._all,
      monitorCount: deptStat._count.monitorBarcode || 0,
      upsCount: deptStat._count.upsBarcode || 0
    }))

    // Get department-based statistics for Laptop assets
    const laptopDepartmentStats = await db.laptop.groupBy({
      by: ['dept'],
      where: { tenantId: user.tenantId },
      _count: {
        _all: true
      }
    })

    // Get department-based statistics for Printer assets
    const printerDepartmentStats = await db.printer.groupBy({
      by: ['dept'],
      where: { tenantId: user.tenantId },
      _count: {
        _all: true
      }
    })

    // Get department-based statistics for License assets
    const licenseDepartmentStats = await db.license.groupBy({
      by: ['dept'],
      where: { tenantId: user.tenantId },
      _count: {
        _all: true
      }
    })

    // Combine all department statistics
    const allDepartmentStats = {
      pc: pcDepartmentStats.map(deptStat => ({
        department: deptStat.dept,
        count: deptStat._count._all,
        monitorCount: deptStat._count.monitorBarcode || 0,
        upsCount: deptStat._count.upsBarcode || 0
      })),
      laptop: laptopDepartmentStats.map(deptStat => ({
        department: deptStat.dept,
        count: deptStat._count._all
      })),
      printer: printerDepartmentStats.map(deptStat => ({
        department: deptStat.dept,
        count: deptStat._count._all
      })),
      license: licenseDepartmentStats.map(deptStat => ({
        department: deptStat.dept,
        count: deptStat._count._all
      }))
    }

    // Get custom fields for all asset types
    const customFields = await db.customField.findMany({
      where: {
        tenantId: user.tenantId
      }
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
      departmentStats: departmentAssetStats,
      allDepartmentStats,
      customFields,
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