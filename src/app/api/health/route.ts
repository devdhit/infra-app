import { NextResponse } from 'next/server';

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
  console.log(`[${getTimestamp()}] 🏥 Health check performed`);
  
  return NextResponse.json(healthData);
}