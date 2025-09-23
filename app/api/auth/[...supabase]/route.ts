import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route for Supabase Auth endpoints
 * This allows OAuth flow to use custom domain instead of Supabase URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { supabase: string[] } }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: 'Supabase URL not configured' },
      { status: 500 }
    )
  }

  // Reconstruct the path
  const path = params.supabase.join('/')
  const { searchParams } = new URL(request.url)

  // Build the target URL
  const targetUrl = `${supabaseUrl}/auth/v1/${path}?${searchParams}`

  // Proxy the request to Supabase
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'X-Forwarded-Host': request.headers.get('host') || '',
      },
    })

    // Return the response from Supabase
    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
      },
    })
  } catch (error) {
    console.error('Error proxying to Supabase:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { supabase: string[] } }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: 'Supabase URL not configured' },
      { status: 500 }
    )
  }

  const path = params.supabase.join('/')
  const { searchParams } = new URL(request.url)

  const targetUrl = `${supabaseUrl}/auth/v1/${path}?${searchParams}`

  try {
    const body = await request.text()
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'X-Forwarded-Host': request.headers.get('host') || '',
      },
      body,
    })

    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('Error proxying to Supabase:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}