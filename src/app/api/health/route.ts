import { db } from '@/lib/db'

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    // Check database connectivity
    await db.$queryRaw`SELECT 1`
    
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return new Response(JSON.stringify({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}