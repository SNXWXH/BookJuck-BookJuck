import React, { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { fetchWithAuthOnServer } from '@/lib/fetch-with-auth-server'
import { ProfileType } from '../../_types'

export const dynamic = 'force-dynamic'

export default async function MyLibraryLayout({
  children,
}: {
  children: ReactNode
}) {
  let nickName = '사용자z'

  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (accessToken && refreshToken) {
      const user = await fetchWithAuthOnServer<ProfileType>(
        '/api/user/profile',
        accessToken,
        refreshToken,
      )
      nickName = user.nickName
    }
  } catch (e) {
    console.error('프로필 로드 실패:', e)
  }

  return (
    <>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {nickName} 님의 서재
        </h1>
        <p className="text-gray-600">
          읽은 책들과 독후감을 관리하세요
        </p>
      </section>
      {children}
    </>
  )
}
