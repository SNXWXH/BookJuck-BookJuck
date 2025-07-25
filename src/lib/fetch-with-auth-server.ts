import { cookies } from 'next/headers'

const API_URL_SERVER = process.env.API_URL!

// // 서버 전용 fetch
// export async function fetchWithAuthOnServer<T = unknown>(
//   endpoint: string,
//   options: RequestInit = {},
// ): Promise<T> {
//   const cookieStore = await cookies()
//   const access = cookieStore.get('accessToken')
//   const refresh = cookieStore.get('refreshToken')

//   const cookieHeader = `${access?.name}=${access?.value};${refresh?.name}=${refresh?.value}`

//   console.log('🚀 ~ cookiesss:', access)
//   console.log('🚀 ~ cookiesssssss:', refresh)

//   // console.log('🚀 ~ cookieStore:', cookieStore)
//   // const cookieHeader = cookieStore
//   //   .getAll()
//   //   .map((cookie) => `${cookie.name}=${cookie.value}`)
//   //   .join('; ')

//   const headers = new Headers(options.headers || {})
//   headers.set('Cookie', cookieHeader)

//   const requestOptions: RequestInit = {
//     ...options,
//     headers,
//   }

//   // 최초 요청
//   const res = await fetch(
//     `${API_URL_SERVER}${endpoint}`,
//     requestOptions,
//   )
//   console.log('🚀 ~ resServertrrrrrrrrrr:', res.status)

//   if (res.status === 401) {
//     try {
//       console.log(40111111111111111111111)
//       const refreshRes = await fetch(
//         `${API_URL_SERVER}/api/auth/refresh`,
//         {
//           method: 'POST',
//           headers: new Headers({
//             Cookie: cookieHeader,
//           }),
//         },
//       )
//       const data = await refreshRes.json()
//       console.log('🚀 ~ refreshRes data:', data)

//       console.log('🚀 ~ headers:')
//       for (const [key, value] of refreshRes.headers.entries()) {
//         console.log(`  ${key}: ${value}`)
//       }

//       if (!refreshRes.ok) {
//         throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
//       }

//       const cookieStore1 = await cookies()
//       const access1 = cookieStore1.get('accessToken')
//       console.log('🚀 ~ access1:', access1)
//       const refresh1 = cookieStore1.get('refreshToken')

//       const cookieHeader1 = `${access1?.name}=${access1?.value}; ${refresh1?.name}=${refresh1?.value}`

//       const headers1 = new Headers(options.headers || {})
//       headers1.set('Cookie', cookieHeader1)

//       const requestOptions1: RequestInit = {
//         ...options,
//         headers: headers1,
//       }

//       // refresh 성공 → 원 요청 재시도
//       const res1 = await fetch(
//         `${API_URL_SERVER}${endpoint}`,
//         requestOptions1,
//       )

//       const data1 = await res1.json()
//       console.log('🚀 ~ res dataaaaa:', data1)
//     } catch (error) {
//       console.error('리프레시 토큰 요청 실패:', error)
//       throw new Error('세션 갱신 중 오류가 발생했습니다.')
//     }
//   }

//   if (!res.ok) {
//     const error = await res.json().catch(() => ({}))
//     throw new Error(
//       (error as { message?: string }).message ||
//         '요청 중 문제가 발생했습니다.',
//     )
//   }

//   return res.json() as Promise<T>
// }

export async function fetchWithAuthOnServer<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies()
  const access = cookieStore.get('accessToken')
  const refresh = cookieStore.get('refreshToken')

  let currentAccessToken = access?.value
  let currentRefreshToken = refresh?.value

  const makeRequest = async (accessToken: string | undefined) => {
    const cookieHeader = `accessToken=${accessToken}; refreshToken=${currentRefreshToken}`

    console.log(
      '🚀 ~ makeRequest ~ cookieHeaderrrrrrrrrrr:',
      cookieHeader,
    )
    const headers = new Headers(options.headers || {})
    headers.set('Cookie', cookieHeader)

    return fetch(`${API_URL_SERVER}${endpoint}`, {
      ...options,
      headers,
    })
  }

  // 최초 요청
  let res = await makeRequest(currentAccessToken)

  if (res.status === 401) {
    try {
      console.log('토큰 갱신 시도...')
      const refreshRes = await fetch(
        `${API_URL_SERVER}/api/auth/refresh`,
        {
          method: 'POST',
          headers: {
            Cookie: `accessToken=${currentAccessToken}; refreshToken=${currentRefreshToken}`,
          },
        },
      )

      if (!refreshRes.ok) {
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      const setCookieHeader = refreshRes.headers.get('set-cookie')
      if (setCookieHeader) {
        const cookies = setCookieHeader
          .split(',')
          .map((cookie) => cookie.trim())
        console.log('🚀 ~ cookies:', cookies)

        for (const cookie of cookies) {
          if (cookie.startsWith('accessToken='))
            currentAccessToken = cookie.split('=')[1].split(';')[0]
          else if (cookie.startsWith('refreshToken='))
            currentRefreshToken = cookie.split('=')[1].split(';')[0]
        }
      }

      console.log('새 액세스 토큰:', currentAccessToken)

      res = await makeRequest(currentAccessToken)
    } catch (error) {
      console.error('리프레시 토큰 요청 실패:', error)
      throw new Error('세션 갱신 중 오류가 발생했습니다.')
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(
      (error as { message?: string }).message ||
        '요청 중 문제가 발생했습니다.',
    )
  }

  return res.json() as Promise<T>
}
