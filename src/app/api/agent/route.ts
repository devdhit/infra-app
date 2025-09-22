import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse, badRequestResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'
import { validateSearchInput, validateOfficeInput } from '@/lib/security'
import { checkAgentPermission } from './permissions'

// Define the interface for agent data
interface AgentData {
  pcName: string
  userName?: string
  ipAddress?: string
  cpu: string
  ram: string
  os: string
  harddisk?: string
  motherboard?: string
  graphics?: string
  macAddress?: string // Add MAC address field
  office?: string // Add Office field
  [key: string]: any // Allow additional custom fields
}

// Map agent field names to database custom field names
const fieldMapping: Record<string, string> = {
  cpu: 'CPU',
  ram: 'RAM',
  os: 'OS',
  ipAddress: 'IP',
  harddisk: 'HARDISK',
  motherboard: 'MOTHERBOARD',
  graphics: 'GRAPHICS',
  macAddress: 'MAC', // Map MAC address field
  office: 'OFFICE' // Map Office field
};

// POST /api/agent - Receive computer configuration data from agent software
export async function POST(request: NextRequest) {
  try {
    // Check permissions
    const permissionCheck = await checkAgentPermission(request, 'submitData')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const user = permissionCheck.user;

    // Parse the request body
    const body = await request.json() as AgentData
    
    // Validate required fields
    if (!body.pcName || !body.cpu || !body.ram || !body.os) {
      return badRequestResponse('Missing required fields: pcName, cpu, ram, and os are required')
    }

    // Sanitize input data
    const sanitizedData: AgentData = {
      pcName: validateSearchInput(body.pcName),
      cpu: validateSearchInput(body.cpu),
      ram: validateSearchInput(body.ram),
      os: validateSearchInput(body.os),
      userName: body.userName ? validateSearchInput(body.userName) : undefined,
      ipAddress: body.ipAddress ? validateSearchInput(body.ipAddress) : undefined,
      harddisk: body.harddisk ? validateSearchInput(body.harddisk) : undefined,
      motherboard: body.motherboard ? validateSearchInput(body.motherboard) : undefined,
      graphics: body.graphics ? validateSearchInput(body.graphics) : undefined,
      macAddress: body.macAddress ? validateSearchInput(body.macAddress) : undefined, // Sanitize MAC address
      office: body.office ? validateOfficeInput(body.office) : undefined // Sanitize Office field with proper function
    }

    // Add any additional custom fields
    Object.keys(body).forEach(key => {
      if (!['pcName', 'userName', 'ipAddress', 'cpu', 'ram', 'os', 'harddisk', 'motherboard', 'graphics', 'macAddress', 'office'].includes(key)) {
        sanitizedData[key] = validateSearchInput(body[key])
      }
    })

    // Log received data (check if logger.info exists)
    if (logger && typeof logger.info === 'function') {
      logger.info('Received agent data', { pcName: sanitizedData.pcName })
    }

    // Get custom fields for this tenant and model type to map field names
    const customFields = await db.customField.findMany({
      where: {
        tenantId: user?.tenantId || '',
        modelType: 'PC'
      }
    });

    // Create a mapping from database field names to custom field objects
    const customFieldMap = new Map(customFields.map(field => [field.name.toUpperCase(), field]));

    // Check if a PC with this pcName or MAC address already exists
    let existingPC = null;
    
    // First, try to find by pcName
    existingPC = await db.pC.findFirst({
      where: {
        pcName: sanitizedData.pcName,
        tenantId: user?.tenantId || ''
      }
    })

    // If not found by pcName, try to find by MAC address if provided
    if (!existingPC && sanitizedData.macAddress) {
      // Find PCs where the customFields contain the MAC address
      existingPC = await db.pC.findFirst({
        where: {
          tenantId: user?.tenantId || '',
          customFields: {
            path: ['MAC'],
            equals: sanitizedData.macAddress
          }
        }
      })
    }

    let pc
    if (existingPC) {
      // Update existing PC
      // Log update (check if logger.info exists)
      if (logger && typeof logger.info === 'function') {
        logger.info('Updating existing PC', { pcId: existingPC.id, pcName: sanitizedData.pcName })
      }
      
      // Prepare update data with proper field mapping
      const updateData: any = {
        pcName: sanitizedData.pcName, // Always update pcName in case it changed
        userName: sanitizedData.userName,
        customFields: {
          ...(existingPC.customFields as Record<string, any> || {})
        }
      }

      // Map agent fields to database custom fields
      Object.entries(sanitizedData).forEach(([key, value]) => {
        if (['pcName', 'userName', 'ipAddress', 'cpu', 'ram', 'os', 'harddisk', 'motherboard', 'graphics', 'macAddress', 'office'].includes(key)) {
          // Map standard agent fields to database custom field names
          const dbFieldName = fieldMapping[key] || key.toUpperCase();
          if (customFieldMap.has(dbFieldName)) {
            updateData.customFields[dbFieldName] = value;
          }
        } else {
          // Handle additional custom fields
          const dbFieldName = key.toUpperCase();
          if (customFieldMap.has(dbFieldName)) {
            updateData.customFields[dbFieldName] = value;
          }
        }
      });

      pc = await db.pC.update({
        where: { 
          id: existingPC.id,
          tenantId: user?.tenantId || ''
        },
        data: updateData
      })
    } else {
      // Create new PC
      // Log creation (check if logger.info exists)
      if (logger && typeof logger.info === 'function') {
        logger.info('Creating new PC', { pcName: sanitizedData.pcName })
      }
      
      // Generate a unique CPU barcode (using a simple approach for now)
      const cpuBarcode = `CPU-${Date.now()}-${sanitizedData.pcName.replace(/\s+/g, '-').toUpperCase()}`
      
      // Prepare custom fields data with proper field mapping
      const customFieldsData: Record<string, any> = {};
      
      // Map agent fields to database custom fields
      Object.entries(sanitizedData).forEach(([key, value]) => {
        if (['pcName', 'userName', 'ipAddress', 'cpu', 'ram', 'os', 'harddisk', 'motherboard', 'graphics', 'macAddress', 'office'].includes(key)) {
          // Map standard agent fields to database custom field names
          const dbFieldName = fieldMapping[key] || key.toUpperCase();
          if (customFieldMap.has(dbFieldName)) {
            customFieldsData[dbFieldName] = value;
          }
        } else {
          // Handle additional custom fields
          const dbFieldName = key.toUpperCase();
          if (customFieldMap.has(dbFieldName)) {
            customFieldsData[dbFieldName] = value;
          }
        }
      });

      pc = await db.pC.create({
        data: {
          pcName: sanitizedData.pcName,
          userName: sanitizedData.userName,
          cpuBarcode: cpuBarcode,
          status: 'active',
          dept: 'IT', // Default department
          tenantId: user?.tenantId || '', // Add tenantId
          customFields: customFieldsData
        }
      })
    }

    // Log success (check if logger.info exists)
    if (logger && typeof logger.info === 'function') {
      logger.info('Successfully processed agent data', { pcId: pc.id, pcName: pc.pcName })
    }
    
    return successResponse(pc, 201)
  } catch (error: any) {
    // Log error (check if logger.error exists)
    if (logger && typeof logger.error === 'function') {
      logger.error('Error processing agent data:', { 
        error: error.message || error.toString(), 
        stack: error.stack || new Error().stack 
      })
    }
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return badRequestResponse('Invalid request body. Please ensure the request is valid JSON.')
    }
    
    return errorResponse('Failed to process agent data. Please try again later.')
  }
}

// GET /api/agent - Health check endpoint
export async function GET(request: NextRequest) {
  // Check permissions
  const permissionCheck = await checkAgentPermission(request, 'healthCheck')
  if (!permissionCheck.authorized) {
    return permissionCheck.response
  }

  return successResponse({ message: 'Agent API is running' })
}