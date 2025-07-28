import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL_SERVER = process.env.API_URL!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 백엔드로 로그인 요청z
    const response = await fetch(
      `${API_URL_SERVER}/api/auth/signin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || '로그인에 실패했습니다.' },
        { status: response.status },
      )
    }

    const data = await response.json()

    // 백엔드에서 받은 set-cookie 헤더 처리
    const setCookieHeader = response.headers.get('set-cookie')
    console.log('🔍 백엔드 응답 set-cookie:', setCookieHeader)

    if (setCookieHeader) {
      const cookieStore = await cookies()

      // set-cookie 헤더 파싱
      const cookieParts = setCookieHeader
        .split(',')
        .map((cookie) => cookie.trim())

      for (const cookiePart of cookieParts) {
        if (cookiePart.startsWith('accessToken=')) {
          const accessToken = cookiePart.split('=')[1].split(';')[0]
          cookieStore.set('accessToken', accessToken, {
            httpOnly: false, // 클라이언트에서도 접근 가능하도록
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
          console.log('✅ accessToken 쿠키 설정 완료')
        } else if (cookiePart.startsWith('refreshToken=')) {
          const refreshToken = cookiePart.split('=')[1].split(';')[0]
          cookieStore.set('refreshToken', refreshToken, {
            httpOnly: false, // 클라이언트에서도 접근 가능하도록
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
          console.log('✅ refreshToken 쿠키 설정 완료')
        }
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('로그인 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
