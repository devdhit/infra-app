import { PrismaClient } from '../generated/prisma'

// Only initialize PrismaClient on the server side
const prismaClient: PrismaClient = new PrismaClient({
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
})

export const db = prismaClient;