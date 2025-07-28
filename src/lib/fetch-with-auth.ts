'use client'

import { FetchWithAuthOptionsType } from '@/app/(without-header)/auth/_types'
import { useAuthStore } from '@/store/auth-store'

// 클라이언트 전용 fetch
export async function fetchWithAuth<T = unknown>(
  endpoint: string,
  options: FetchWithAuthOptionsType = {},
): Promise<T> {
  if (typeof window === 'undefined') {
    throw new Error(
      'fetchWithAuth는 클라이언트 컴포넌트에서만 사용할 수 있습니다.',
    )
  }

  const restOptions = options

  const headers = new Headers(restOptions.headers || {})
  const requestOptions: RequestInit = {
    ...restOptions,
    headers,
    credentials: 'include',
  }

  const res = await fetch(
    `/api/proxy${endpoint}`,
    requestOptions,
  )

  if (res.status === 401) {
    useAuthStore.getState().clearAuth()
    throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
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
