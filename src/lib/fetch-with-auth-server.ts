import { headers } from 'next/headers'

const API_URL_SERVER = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL!

export async function fetchWithAuthOnServer<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  console.log('🌍 환경:', process.env.NODE_ENV)
  console.log('🔗 API_URL_SERVER:', API_URL_SERVER)
  
  try {
    // cookies() 대신 headers() 사용
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie')
    
    console.log('🍪 원본 쿠키 헤더 존재:', !!cookieHeader)
    console.log('🍪 쿠키 헤더 길이:', cookieHeader?.length || 0)
    
    if (cookieHeader) {
      console.log('🍪 쿠키 헤더 일부:', cookieHeader.substring(0, 100) + '...')
    }

    if (!cookieHeader) {
      console.error('❌ 쿠키 헤더가 없습니다.')
      throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.')
    }

    // 쿠키에서 토큰 추출
    const extractTokenFromCookie = (cookieString: string, tokenName: string): string | null => {
      const regex = new RegExp(`${tokenName}=([^;]+)`)
      const match = cookieString.match(regex)
      return match ? match[1] : null
    }

    let currentAccessToken = extractTokenFromCookie(cookieHeader, 'accessToken')
    let currentRefreshToken = extractTokenFromCookie(cookieHeader, 'refreshToken')

    console.log('🔑 accessToken 존재:', !!currentAccessToken)
    console.log('🔑 refreshToken 존재:', !!currentRefreshToken)

    if (!currentAccessToken || !currentRefreshToken) {
      console.error('❌ 필수 토큰이 없습니다.')
      throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.')
    }

    // API 요청 함수
    const makeRequest = async (accessToken: string, refreshToken: string) => {
      const requestCookie = `accessToken=${accessToken}; refreshToken=${refreshToken}`
      
      const requestHeaders = new Headers(options.headers || {})
      requestHeaders.set('Cookie', requestCookie)
      requestHeaders.set('Content-Type', 'application/json')
      
      console.log('📤 요청 URL:', `${API_URL_SERVER}${endpoint}`)
      console.log('📤 요청 메서드:', options.method || 'GET')

      const requestConfig: RequestInit = {
        ...options,
        headers: requestHeaders,
        cache: 'no-store',
      }

      console.log('📤 요청 시작...')
      const response = await fetch(`${API_URL_SERVER}${endpoint}`, requestConfig)
      console.log('📥 응답 상태:', response.status)
      
      return response
    }

    // 최초 요청
    console.log('🚀 최초 API 요청 시작')
    let res = await makeRequest(currentAccessToken, currentRefreshToken)

    // 401 에러시 토큰 갱신 시도
    if (res.status === 401) {
      console.log('🔄 401 에러 - 토큰 갱신 시도')
      
      try {
        const refreshHeaders = new Headers()
        refreshHeaders.set('Cookie', `accessToken=${currentAccessToken}; refreshToken=${currentRefreshToken}`)
        refreshHeaders.set('Content-Type', 'application/json')
        
        console.log('🔄 리프레시 요청 시작...')
        const refreshRes = await fetch(`${API_URL_SERVER}/api/auth/refresh`, {
          method: 'POST',
          headers: refreshHeaders,
          cache: 'no-store',
        })

        console.log('🔄 리프레시 응답 상태:', refreshRes.status)

        if (!refreshRes.ok) {
          const refreshError = await refreshRes.text().catch(() => 'Unknown error')
          console.error('❌ 리프레시 실패:', refreshError)
          throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
        }

        // 새 토큰 추출
        const setCookieHeader = refreshRes.headers.get('set-cookie')
        console.log('🍪 set-cookie 헤더 존재:', !!setCookieHeader)
        
        if (setCookieHeader) {
          console.log('🍪 set-cookie 헤더:', setCookieHeader)
          
          // 쿠키 파싱 개선
          const cookies = setCookieHeader.split(',').map(cookie => cookie.trim())
          console.log('🍪 파싱된 쿠키 개수:', cookies.length)

          for (const cookie of cookies) {
            if (cookie.startsWith('accessToken=')) {
              currentAccessToken = cookie.split('=')[1]?.split(';')[0]
              console.log('✅ 새 accessToken 추출됨')
            } else if (cookie.startsWith('refreshToken=')) {
              currentRefreshToken = cookie.split('=')[1]?.split(';')[0]
              console.log('✅ 새 refreshToken 추출됨')
            }
          }
        }

        if (!currentAccessToken) {
          throw new Error('새 토큰을 받지 못했습니다.')
        }

        console.log('🔄 새 토큰으로 재요청')
        res = await makeRequest(currentAccessToken, currentRefreshToken!)
        
      } catch (error) {
        console.error('❌ 토큰 갱신 실패:', error)
        throw new Error('세션 갱신 중 오류가 발생했습니다.')
      }
    }

    // 최종 응답 처리
    if (!res.ok) {
      console.error('❌ 최종 요청 실패:', res.status)
      const errorText = await res.text().catch(() => 'Unknown error')
      console.error('❌ 에러 내용:', errorText)
      
      let errorMessage = '요청 중 문제가 발생했습니다.'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorMessage
      } catch {
        // JSON 파싱 실패시 기본 메시지 사용
      }
      
      throw new Error(errorMessage)
    }

    console.log('✅ 요청 성공!')
    return res.json() as Promise<T>
    
  } catch (error) {
    console.error('🔥 fetchWithAuthOnServer 전체 에러:', error)
    throw error
  }
}
