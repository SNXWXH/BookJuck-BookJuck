import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL_SERVER = process.env.API_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'PUT')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'PATCH')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'DELETE')
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    const refreshToken = cookieStore.get('refreshToken')?.value

    const endpoint = `/${params.path.join('/')}`
    const url = `${API_URL_SERVER}${endpoint}`

    // request body 처리
    let body = undefined
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text()
      } catch {
        // body가 없으면 무시
      }
    }

    // 쿠키 헤더 구성
    const cookieHeader = `accessToken=${accessToken}; refreshToken=${refreshToken}`
    
    const headers = new Headers()
    
    // 원본 요청의 헤더 복사 (Cookie 제외)
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'cookie' && key.toLowerCase() !== 'host') {
        headers.set(key, value)
      }
    })
    
    // 쿠키 헤더 설정
    headers.set('Cookie', cookieHeader)

    console.log(`🚀 프록시 요청: ${method} ${url}`)
    console.log('🍪 쿠키 헤더:', cookieHeader)

    const response = await fetch(url, {
      method,
      headers,
      body: body || undefined,
    })

    // 401 오류 시 토큰 갱신 시도
    if (response.status === 401) {
      console.log('토큰 갱신 시도...')
      const refreshRes = await fetch(`${API_URL_SERVER}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
        },
      })

      if (refreshRes.ok) {
        // 새 토큰으로 재시도
        const setCookieHeader = refreshRes.headers.get('set-cookie')
        let newAccessToken = accessToken
        let newRefreshToken = refreshToken

        if (setCookieHeader) {
          const cookies = setCookieHeader.split(',').map(cookie => cookie.trim())
          for (const cookie of cookies) {
            if (cookie.startsWith('accessToken=')) {
              newAccessToken = cookie.split('=')[1].split(';')[0]
            } else if (cookie.startsWith('refreshToken=')) {
              newRefreshToken = cookie.split('=')[1].split(';')[0]
            }
          }
        }

        const newCookieHeader = `accessToken=${newAccessToken}; refreshToken=${newRefreshToken}`
        headers.set('Cookie', newCookieHeader)

        console.log('🔄 새 토큰으로 재시도')
        const retryResponse = await fetch(url, {
          method,
          headers,
          body: body || undefined,
        })

        const responseData = await retryResponse.text()
        const nextResponse = new NextResponse(responseData, {
          status: retryResponse.status,
          headers: {
            'Content-Type': retryResponse.headers.get('Content-Type') || 'application/json',
          },
        })

        // 갱신된 쿠키를 클라이언트에 설정
        if (setCookieHeader) {
          const cookieStore = await cookies()
          const cookieParts = setCookieHeader.split(',').map(cookie => cookie.trim())
          for (const cookie of cookieParts) {
            if (cookie.startsWith('accessToken=')) {
              const token = cookie.split('=')[1].split(';')[0]
              cookieStore.set('accessToken', token, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              })
            } else if (cookie.startsWith('refreshToken=')) {
              const token = cookie.split('=')[1].split(';')[0]
              cookieStore.set('refreshToken', token, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              })
            }
          }
        }

        return nextResponse
      } else {
        // 리프레시도 실패하면 401 반환
        return NextResponse.json(
          { error: '세션이 만료되었습니다.' },
          { status: 401 }
        )
      }
    }

    const responseData = await response.text()
    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('프록시 요청 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}