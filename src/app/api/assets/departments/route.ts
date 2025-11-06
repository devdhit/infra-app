import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { errorResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// GET /api/assets/departments - Get all unique departments for the current tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const assetType = searchParams.get('assetType')

    // Validate assetType if provided
    const validAssetTypes = ['pc', 'laptop', 'printer', 'license', 'internet', 'fixed-asset']
    if (assetType && !validAssetTypes.includes(assetType)) {
      return errorResponse('Invalid asset type', 400)
    }

    let departments: string[] = []

    // Fetch departments based on asset type or all if not specified
    if (!assetType || assetType === 'pc') {
      const pcDepartments = await db.pC.findMany({
        where: { 
          tenantId: user.tenantId,
          dept: { not: "" }
        },
        select: { dept: true },
        distinct: ['dept']
      })
      
      departments = departments.concat(
        pcDepartments
          .filter((pc: { dept: string }) => pc.dept && pc.dept.trim() !== '')
          .map((pc: { dept: string }) => pc.dept)
      )
    }

    if (!assetType || assetType === 'laptop') {
      const laptopDepartments = await db.laptop.findMany({
        where: { 
          tenantId: user.tenantId,
          dept: { not: "" }
        },
        select: { dept: true },
        distinct: ['dept']
      })
      
      departments = departments.concat(
        laptopDepartments
          .filter((laptop: { dept: string }) => laptop.dept && laptop.dept.trim() !== '')
          .map((laptop: { dept: string }) => laptop.dept)
      )
    }

    if (!assetType || assetType === 'printer') {
      const printerDepartments = await db.printer.findMany({
        where: { 
          tenantId: user.tenantId,
          dept: { not: "" }
        },
        select: { dept: true },
        distinct: ['dept']
      })
      
      departments = departments.concat(
        printerDepartments
          .filter((printer: { dept: string }) => printer.dept && printer.dept.trim() !== '')
          .map((printer: { dept: string }) => printer.dept)
      )
    }

    if (!assetType || assetType === 'license') {
      const licenseDepartments = await db.license.findMany({
        where: { 
          tenantId: user.tenantId,
          dept: { not: "" }
        },
        select: { dept: true },
        distinct: ['dept']
      })
      
      departments = departments.concat(
        licenseDepartments
          .filter((license: { dept: string | null }) => license.dept && license.dept.trim() !== '')
          .map((license: { dept: string | null }) => license.dept as string)
      )
    }

    if (!assetType || assetType === 'internet') {
      const internetDepartments = await db.internet.findMany({
        where: { 
          tenantId: user.tenantId,
          dept: { not: "" }
        },
        select: { dept: true },
        distinct: ['dept']
      })
      
      departments = departments.concat(
        internetDepartments
          .filter((internet: { dept: string }) => internet.dept && internet.dept.trim() !== '')
          .map((internet: { dept: string }) => internet.dept)
      )
    }

    if (!assetType || assetType === 'fixed-asset') {
      const fixedAssetDepartments = await db.fixedAsset.findMany({
        where: { 
          tenantId: user.tenantId,
          dept: { not: "" }
        },
        select: { dept: true },
        distinct: ['dept']
      })
      
      departments = departments.concat(
        fixedAssetDepartments
          .filter((fixedAsset: { dept: string }) => fixedAsset.dept && fixedAsset.dept.trim() !== '')
          .map((fixedAsset: { dept: string }) => fixedAsset.dept)
      )
    }

    // Remove duplicates and sort
    const uniqueDepartments = Array.from(new Set(departments)).sort()

    return new Response(JSON.stringify({ departments: uniqueDepartments }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    logger.error('Error fetching departments:', error)
    return errorResponse('Internal server error', 500)
  }
}