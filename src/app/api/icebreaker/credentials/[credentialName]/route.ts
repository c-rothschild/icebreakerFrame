import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { credentialName: string } }
) {
  // Get the raw credential name from params
  const rawCredentialName = params.credentialName;
  
  // URL-encode the credential name to handle special characters
  const encodedCredentialName = encodeURIComponent(rawCredentialName);
  
  try {
    const apiUrl = `https://app.icebreaker.xyz/api/v1/credentials?credentialName=${encodedCredentialName}`;
    console.log("Fetching from:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    
    if (!response.ok) {
      console.error(`Icebreaker API responded with status: ${response.status}`);
      return NextResponse.json(
        { error: `API responded with status: ${response.status}` }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Icebreaker:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}