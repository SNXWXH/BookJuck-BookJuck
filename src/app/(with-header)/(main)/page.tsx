'use client'

import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { FC, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookType,
  AddBookResponse,
  DeleteBookResponse,
} from '@/app/(with-header)/(main)/_types'
import { fetchWithAuth } from '@/lib/fetch-with-auth'
import Modal from '@/common/modal'

export interface BookCardPropsType {
  book: BookType
}

interface LibraryBook {
  id: string
  title: string
  author: string
  thumbnailUrl: string
  review?: {
    endDate?: string
    memo?: string
    rating?: number
    tags?: string[]
  }
}

const BookCard: FC<BookCardPropsType> = ({ book }) => {
  const [isAdded, setIsAdded] = useState(false)
  const [libraryBookId, setLibraryBookId] = useState<string | null>(
    null,
  )
  const [modalMessage, setModalMessage] = useState<string | null>(
    null,
  )
  const [shouldRedirectAfterModal, setShouldRedirectAfterModal] =
    useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkIfBookExists = async () => {
      // const cookies = document.cookie
      // const accessToken = cookies
      //   .split('; ')
      //   .find((row) => row.startsWith('accessToken='))
      //   ?.split('=')[1]

      // if (!accessToken) {
      //   return
      // }

      try {
        const libraryBooks = await fetchWithAuth<LibraryBook[]>(
          '/api/library?offset=0&limit=100',
          { auth: true },
        )
        const existingBook = libraryBooks.find(
          (b) => b.title === book.title && b.author === book.author,
        )
        if (existingBook) {
          setIsAdded(true)
          setLibraryBookId(existingBook.id)
        }
      } catch (error) {
        console.error('내 서재 상태 확인 실패:', error)
      }
    }

    checkIfBookExists()
  }, [book.title, book.author])

  const handleToggleLibrary = async () => {
    const cookies = document.cookie
    const accessToken = cookies
      .split('; ')
      .find((row) => row.startsWith('accessToken='))
      ?.split('=')[1]

    if (!accessToken) {
      setModalMessage('로그인 후 이용해주세요.')
      setShouldRedirectAfterModal(true)
      return
    }

    try {
      if (!isAdded) {
        const res = await fetchWithAuth<AddBookResponse>(
          '/api/library',
          {
            method: 'POST',
            auth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: book.title,
              author: book.author,
              thumbnailUrl: book.cover,
              isbn: book.isbn,
            }),
          },
        )

        setLibraryBookId(res.book.id)
        setModalMessage('내 서재에 추가되었습니다!')
        setIsAdded(true)
      } else {
        if (!libraryBookId) {
          setModalMessage('삭제할 책의 ID가 없습니다.')
          return
        }

        await fetchWithAuth<DeleteBookResponse>(
          `/api/library/${libraryBookId}`,
          {
            method: 'DELETE',
            auth: true,
          },
        )

        setModalMessage('내 서재에서 삭제되었습니다.')
        setIsAdded(false)
        setLibraryBookId(null)
      }
    } catch (error: unknown) {
      console.error('에러 내용:', error)

      let status: number | undefined

      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof (error as { status?: number }).status === 'number'
      ) {
        status = (error as { status: number }).status
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response
          ?.status === 'number'
      ) {
        status = (error as { response: { status: number } }).response
          .status
      } else if (
        error instanceof Error &&
        error.message.includes('이미')
      ) {
        status = 409
      }

      if (status === 401) {
        setModalMessage('로그인 후 이용해주세요.')
        setShouldRedirectAfterModal(true)
      } else if (status === 409) {
        setModalMessage('내 서재에 이미 존재하는 책입니다.')
        setIsAdded(true)
      } else if (status === 404) {
        setModalMessage('삭제할 책을 찾을 수 없습니다.')
        setIsAdded(false)
        setLibraryBookId(null)
      } else {
        setModalMessage(
          isAdded
            ? '서재 삭제에 실패했습니다.'
            : '서재 추가에 실패했습니다.',
        )
      }
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow w-full h-[300px] flex flex-col overflow-hidden">
        <div className="relative bg-gray-200 flex justify-center items-center h-[60%] p-4 rounded-t-lg">
          <Image
            src={book.cover || '/images/placeholder-book.svg'}
            alt={book.title}
            width={96}
            height={144}
            className="object-contain rounded max-h-full"
          />

          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={handleToggleLibrary}
              className="w-8 h-8 flex items-center justify-center bg-white text-black border border-gray-300 rounded-full hover:bg-gray-100 transition cursor-pointer"
              aria-label={
                isAdded ? '내 서재에서 삭제' : '내 서재에 추가'
              }
            >
              <BookOpen
                className="w-4 h-4"
                stroke={isAdded ? '#22C55E' : 'black'}
                fill={isAdded ? '#22C55E' : 'none'}
              />
            </button>
          </div>

          {isAdded && (
            <div
              className="absolute bottom-2 left-2 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md select-none"
              style={{ backgroundColor: '#22C55E' }}
            >
              읽음
            </div>
          )}
        </div>

        <div className="h-[40%] px-3 py-2 flex flex-col justify-center items-center text-center">
          <h3
            className="text-lg font-semibold w-full truncate"
            title={book.title}
          >
            {book.title}
          </h3>
          <p
            className="text-base text-gray-500 w-full truncate"
            title={book.author}
          >
            {book.author}
          </p>
          <p
            className="text-sm text-gray-400 w-full truncate"
            title={book.isbn}
          >
            ISBN: {book.isbn || '정보 없음'}
          </p>
        </div>
      </div>

      {modalMessage && (
        <Modal>
          <div className="text-center">
            <p className="mb-4">{modalMessage}</p>
            <button
              onClick={() => {
                setModalMessage(null)
                if (shouldRedirectAfterModal) {
                  router.push('/auth/log-in')
                }
              }}
              className="px-4 py-2 bg-slate-950 text-white rounded hover:bg-slate-900 cursor-pointer"
            >
              확인
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default BookCard
