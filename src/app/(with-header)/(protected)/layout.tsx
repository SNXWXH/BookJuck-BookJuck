'use client'

import { ReactNode } from 'react'

// import { ReactNode, useEffect, useState } from 'react'
// import { useRouter, usePathname } from 'next/navigation'
// import { useAuthStore } from '@/store/auth-store'
// import Modal from '@/common/modal'

interface ProtectedLayoutProps {
  children: ReactNode
}

export default function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  // const router = useRouter()
  // const pathname = usePathname()
  // const { user } = useAuthStore((state) => state)
  // const [showModal, setShowModal] = useState(false)

  // useEffect(() => {
  //   if (!user) {
  //     const isAuthPage = pathname.startsWith('/auth')
  //     if (!isAuthPage) {
  //       sessionStorage.setItem('redirectAfterLogin', pathname)
  //     }

  //     setShowModal(true)
  //   }
  // }, [user, pathname])

  // if (!user && showModal) {
  //   return (
  //     <Modal>
  //       <div className="mb-4">
  //         <p className="text-center text-md">
  //           로그인이 필요한 서비스입니다.
  //         </p>
  //         <p className="text-center text-md">로그인 하시겠습니까?</p>
  //       </div>
  //       <div className="flex justify-center gap-4">
  //         <button
  //           onClick={() => router.push('/auth/log-in')}
  //           className="bg-slate-950 hover:bg-gray-800 hover:cursor-pointer text-white text-sm py-2 px-4 rounded"
  //         >
  //           예
  //         </button>
  //         <button
  //           onClick={() => router.push('/')}
  //           className="border border-gray-200 hover:bg-gray-100 hover:cursor-pointer text-sm py-2 px-4 rounded"
  //         >
  //           아니오
  //         </button>
  //       </div>
  //     </Modal>
  //   )
  // }

  return <>{children}</>
}
