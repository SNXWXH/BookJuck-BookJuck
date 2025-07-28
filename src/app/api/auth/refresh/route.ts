import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL_SERVER = process.env.API_URL!

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: '리프레시 토큰이 없습니다.' },
        { status: 401 },
      )
    }

    // 백엔드로 토큰 갱신 요청
    const response = await fetch(
      `${API_URL_SERVER}/api/auth/refresh`,
      {
        method: 'POST',
        headers: {
          Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
        },
      },
    )

    if (!response.ok) {
      // 리프레시 토큰도 만료된 경우 쿠키 삭제
      const clearCookiesResponse = NextResponse.json(
        { error: '세션이 만료되었습니다.' },
        { status: 401 },
      )
      clearCookiesResponse.cookies.delete('accessToken')
      clearCookiesResponse.cookies.delete('refreshToken')
      return clearCookiesResponse
    }

    // 백엔드에서 받은 새로운 토큰으로 쿠키 업데이트
    const setCookieHeader = response.headers.get('set-cookie')
    console.log('🔍 리프레시 응답 set-cookie:', setCookieHeader)

    const successResponse = NextResponse.json({ success: true })

    if (setCookieHeader) {
      const cookieParts = setCookieHeader
        .split(',')
        .map((cookie) => cookie.trim())

      for (const cookiePart of cookieParts) {
        if (cookiePart.startsWith('accessToken=')) {
          const newAccessToken = cookiePart.split('=')[1].split(';')[0]
          successResponse.cookies.set('accessToken', newAccessToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
          console.log('✅ accessToken 갱신 완료')
        } else if (cookiePart.startsWith('refreshToken=')) {
          const newRefreshToken = cookiePart.split('=')[1].split(';')[0]
          successResponse.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
          console.log('✅ refreshToken 갱신 완료')
        }
      }
    }

    return successResponse
  } catch (error) {
    console.error('토큰 갱신 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}