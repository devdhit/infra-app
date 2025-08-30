import { PrismaClient } from '@/generated/prisma'

declare global {
  var prisma: PrismaClient | undefined
}

// Optimize Prisma client with query logging in development
const client = globalThis.prisma || new PrismaClient({
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

if (process.env.NODE_ENV !== 'production') globalThis.prisma = client

export const db = client

// Add query performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  client.$on('query', (e) => {
    console.log('Query: ' + e.query)
    console.log('Params: ' + e.params)
    console.log('Duration: ' + e.duration + 'ms')
  })
  
  client.$on('error', (e) => {
    console.error('Prisma Error: ', e)
  })
}