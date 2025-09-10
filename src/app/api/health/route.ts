import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

// Helper function to get formatted timestamp
function getTimestamp() {
    return new Date().toISOString();
}

export async function GET() {
  const healthData = { 
    status: 'ok', 
    timestamp: getTimestamp(),
    uptime: process.uptime()
  };
  
  // Log the health check
  logger.debug(`[${getTimestamp()}] 🏥 Health check performed`);
  
  return NextResponse.json(healthData);
}