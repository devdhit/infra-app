import { PrismaClient } from '../generated/prisma'

// Prevent multiple instances of Prisma Client in development
// Reference: https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
const prismaClientSingleton = () => {
  // Parse DATABASE_URL to extract connection parameters
  let databaseUrl = process.env.DATABASE_URL || '';
  
  // Add connection pooling parameters if not already present
  if (databaseUrl && !databaseUrl.includes('connection_limit')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${separator}connection_limit=2&pool_timeout=30`;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ] : [],
    // Add connection pooling configuration to prevent "too many connections" errors
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Configure transaction options for better connection management
    transactionOptions: {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    },
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

// Track if database shutdown handlers have been registered
let dbShutdownHandlersRegistered = false;

// Gracefully disconnect the Prisma client when the application shuts down
if (typeof window === 'undefined') {
  // Server-side only
  process.on('beforeExit', async () => {
    try {
      await db.$disconnect()
    } catch (error) {
      console.error('Error disconnecting database:', error)
    }
  })
  
  // Only register shutdown handlers if they haven't been registered yet
  if (!dbShutdownHandlersRegistered) {
    dbShutdownHandlersRegistered = true;
    
    const dbShutdownHandler = async () => {
      try {
        await db.$disconnect()
      } catch (error) {
        console.error('Error disconnecting database:', error)
      }
      // Don't exit here as the main server shutdown handler will handle that
    };
    
    process.on('SIGTERM', dbShutdownHandler);
    process.on('SIGINT', dbShutdownHandler);
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db