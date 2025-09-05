import { PrismaClient } from '../src/generated/prisma'


const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.history.deleteMany({})
  await prisma.warehouseIT.deleteMany({})
  await prisma.license.deleteMany({})
  await prisma.printer.deleteMany({})
  await prisma.laptop.deleteMany({})
  await prisma.pC.deleteMany({})
  await prisma.customField.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.tenant.deleteMany({})
  console.log('Existing data cleared.')

  // Create a sample tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Company',
      description: 'A sample company for demonstration purposes'
    }
  })

  console.log('Created tenant:', tenant)

  // Create a sample admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: '$2b$10$SXMN6FYOO9U48sT1b8Bif.RPAJqyJWLWaL79QsWDIvNtYTUSzdiFe', // bcrypt hash for "password"
      name: 'Admin User',
      role: 'admin',
      tenantId: tenant.id
    }
  })

  console.log('Created admin user:', adminUser)

  // Create a sample regular user
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@demo.com',
      password: '$2b$10$SXMN6FYOO9U48sT1b8Bif.RPAJqyJWLWaL79QsWDIvNtYTUSzdiFe', // bcrypt hash for "password"
      name: 'Regular User',
      role: 'user',
      tenantId: tenant.id
    }
  })

  // Create sample PC assets
  await Promise.all([
    prisma.pC.create({
      data: {
        dept: 'IT',
        cpuBarcode: 'PC001',
        cpuSapBarcode: 'SAP001',
        pcName: 'IT-PC-001',
        status: 'working',
        note: 'Main IT department computer',
        tenantId: tenant.id,
        userName: adminUser.name
      }
    }),
    prisma.pC.create({
      data: {
        dept: 'HR',
        cpuBarcode: 'PC002',
        cpuSapBarcode: 'SAP002',
        pcName: 'HR-PC-001',
        status: 'working',
        note: 'HR department computer',
        tenantId: tenant.id,
        userName: regularUser.name
      }
    }),
    prisma.pC.create({
      data: {
        dept: 'Finance',
        cpuBarcode: 'PC003',
        pcName: 'FIN-PC-001',
        status: 'repair',
        note: 'Under maintenance',
        tenantId: tenant.id
      }
    })
  ])

  // Create sample Laptop assets
  await Promise.all([
    prisma.laptop.create({
      data: {
        dept: 'Sales',
        barcode: 'LAP001',
        sapBarcode: 'SAPL001',
        model: 'Dell XPS 15',
        email: 'sales@demo.com',
        status: 'working',
        tenantId: tenant.id,
        userName: regularUser.name // Changed from userId to userName
      }
    }),
    prisma.laptop.create({
      data: {
        dept: 'Marketing',
        barcode: 'LAP002',
        model: 'MacBook Pro',
        status: 'leave',
        tenantId: tenant.id,
        userName: adminUser.name // Added userName field
      }
    })
  ])

  // Create sample Printer assets
  await Promise.all([
    prisma.printer.create({
      data: {
        dept: 'IT',
        barcode: 'PRN001',
        model: 'HP LaserJet Pro',
        location: 'IT Department',
        ip: '192.168.1.100',
        color: 'Color',
        tenantId: tenant.id
      }
    }),
    prisma.printer.create({
      data: {
        dept: 'HR',
        barcode: 'PRN002',
        model: 'Canon ImageCLASS',
        location: 'HR Department',
        color: 'Black & White',
        tenantId: tenant.id
      }
    })
  ])

  // Create sample License assets
  await Promise.all([
    prisma.license.create({
      data: {
        productType: 'Microsoft Office 365',
        productKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
        userName: 'admin@demo.com',
        dept: 'IT',
        updateStatus: 'working',
        tenantId: tenant.id
      }
    }),
    prisma.license.create({
      data: {
        productType: 'Adobe Creative Cloud',
        productKey: 'YYYYY-YYYYY-YYYYY-YYYYY-YYYYY',
        userName: 'user@demo.com',
        dept: 'Design',
        updateStatus: 'leave',
        tenantId: tenant.id
      }
    })
  ])

  // Create sample Warehouse IT assets
  await Promise.all([
    prisma.warehouseIT.create({
      data: {
        cpuBarcode: 'CPU001',
        cpuSapBarcode: 'SAPCPU001',
        status: 'working',
        note: 'New in stock',
        tenantId: tenant.id
      }
    }),
    prisma.warehouseIT.create({
      data: {
        cpuBarcode: 'CPU002',
        status: 'leave',
        note: 'Reserved for IT department',
        tenantId: tenant.id
      }
    })
  ])

}

main()
  .catch((_) => {
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })