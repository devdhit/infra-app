import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import logger from '@/lib/logger';

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

    // Check if user has permission to view assets dashboard
    const hasViewPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'assets',
      'view'
    )
    
    if (!hasViewPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
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
    const pcAssets = await db.pC.findMany({
      where: { tenantId: user.tenantId },
      select: {
        dept: true,
        monitorBarcode: true,
        upsBarcode: true
      }
    })

    // Group PC assets by department and count monitors and UPSs (excluding 'N/A' values)
    const pcDepartmentStatsMap: Record<string, { count: number; monitorCount: number; upsCount: number }> = {}
    
    pcAssets.forEach(pc => {
      if (!pcDepartmentStatsMap[pc.dept]) {
        pcDepartmentStatsMap[pc.dept] = {
          count: 0,
          monitorCount: 0,
          upsCount: 0
        }
      }
      
      // Ensure the department entry exists before accessing it
      const deptStats = pcDepartmentStatsMap[pc.dept];
      if (deptStats) {
        deptStats.count += 1;
        
        // Count monitors and UPSs only if they exist and are not 'N/A'
        if (pc.monitorBarcode && pc.monitorBarcode !== 'N/A' && String(pc.monitorBarcode).trim() !== '') {
          deptStats.monitorCount += 1;
        }
        
        if (pc.upsBarcode && pc.upsBarcode !== 'N/A' && String(pc.upsBarcode).trim() !== '') {
          deptStats.upsCount += 1;
        }
      }
    })
    
    // Convert to array format
    const pcDepartmentStats = Object.entries(pcDepartmentStatsMap).map(([dept, stats]) => ({
      dept,
      _count: {
        _all: stats.count,
        monitorBarcode: stats.monitorCount,
        upsBarcode: stats.upsCount
      }
    }))

    // Transform department stats to include counts for PCs, Monitors, and UPSs
    const departmentAssetStats = pcDepartmentStats.map((deptStat: any) => ({
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
      pc: pcDepartmentStats.map((deptStat: any) => ({
        department: deptStat.dept,
        count: deptStat._count._all,
        monitorCount: deptStat._count.monitorBarcode || 0,
        upsCount: deptStat._count.upsBarcode || 0
      })),
      laptop: laptopDepartmentStats.map((deptStat: any) => ({
        department: deptStat.dept,
        count: deptStat._count._all
      })),
      printer: printerDepartmentStats.map((deptStat: any) => ({
        department: deptStat.dept,
        count: deptStat._count._all
      })),
      license: licenseDepartmentStats.map((deptStat: any) => ({
        department: deptStat.dept,
        count: deptStat._count._all
      }))
    }

    // Get total counts for Monitors, and UPSs across all assets (excluding 'N/A' values)
    const totalMonitorCount = Object.values(pcDepartmentStatsMap).reduce((sum, dept) => sum + dept.monitorCount, 0)
    const totalUpsCount = Object.values(pcDepartmentStatsMap).reduce((sum, dept) => sum + dept.upsCount, 0)

    // Get total department count
    const totalDepartmentCount = new Set([
      ...pcDepartmentStats.map((dept: any) => dept.dept),
      ...laptopDepartmentStats.map((dept: any) => dept.dept),
      ...printerDepartmentStats.map((dept: any) => dept.dept),
      ...licenseDepartmentStats.map((dept: any) => dept.dept)
    ]).size;

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

    // Get license expiration data (licenses expiring in the next 30 days)
    const upcomingExpirations = await db.license.count({
      where: {
        tenantId: user.tenantId,
        date: {
          lte: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          gte: new Date() // Not already expired
        }
      }
    })

    // Get user count for the tenant
    const userCount = await db.user.count({
      where: {
        tenantId: user.tenantId
      }
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
      recentActivities,
      licenseExpirations: upcomingExpirations,
      userCount,
      totalDepartmentCount,
      totalMonitorCount,
      totalUpsCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    logger.error('Error fetching dashboard data:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}