import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Sound Scouting API is running'
  });
}

export async function HEAD() {
  return new Response(null, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}