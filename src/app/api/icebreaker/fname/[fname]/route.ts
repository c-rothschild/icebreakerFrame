import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { fname: string } }
) {
  const fname = params.fname;
  
  try {
    const response = await fetch(`https://app.icebreaker.xyz/api/v1/fname/${fname}/`, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Icebreaker:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}