'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { BookType, RawBookItemType } from './_types'
import BookCard from './_components/book-card'
import BookCardSkeleton from './_components/skeleton/book-card-skeleton'
import ListPageSkeleton from './_components/skeleton/list-page-skeleton'

const MAX_PAGE = 10 

export default function Home() {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState<BookType[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const fetchDefaultBooks = useCallback(
    async (pageToLoad: number) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/aladin-list?page=${pageToLoad}`)
        const text = await res.text()
        const data = JSON.parse(text)

        const mapped: BookType[] = (data.item || []).map(
          (item: RawBookItemType) => ({
            id: item.itemId,
            cover:
              item.cover ||
              'https://via.placeholder.com/96x144?text=No+Image',
            title: item.title || '제목 없음',
            author: item.author || '저자 미상',
            isbn: item.isbn || '',
          }),
        )

        setBooks((prev) =>
          pageToLoad === 1 ? mapped : [...prev, ...mapped],
        )

        if (!data.item || data.item.length === 0 || pageToLoad >= MAX_PAGE) {
          setHasMore(false)
        }
      } catch (e) {
        console.error('기본 리스트 불러오기 실패:', e)
        setHasMore(false)
      } finally {
        setLoading(false)
        setInitialLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!query.trim()) {
      fetchDefaultBooks(page)
    }
  }, [page, query, fetchDefaultBooks])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1)
        }
      },
      { rootMargin: '200px', threshold: 0.1 },
    )
    const el = loaderRef.current
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
    }
  }, [hasMore, loading])

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setInitialLoading(true)
    try {
      const res = await fetch(
        `/api/aladin-search?query=${encodeURIComponent(query)}`,
      )
      const text = await res.text()
      const data = JSON.parse(text)

      const mapped: BookType[] = (data.item || []).map(
        (item: RawBookItemType) => ({
          id: item.itemId,
          cover:
            item.cover ||
            'https://via.placeholder.com/96x144?text=No+Image',
          title: item.title || '제목 없음',
          author: item.author || '저자 미상',
          isbn: item.isbn || '',
        }),
      )

      setBooks(mapped)
      setHasMore(false)
    } catch (e) {
      console.error('검색 실패:', e)
      setBooks([])
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  if (initialLoading) {
    return <ListPageSkeleton />
  }

  return (
    <main className="flex flex-col justify-center w-full mx-auto pt-2 p-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-12 text-center w-full leading-snug">
        당신만의 독서 여행을&nbsp;
        <br className="block sm:hidden" />
        시작해 보세요
      </h1>

      <div className="w-full flex flex-col items-center">
        <div className="relative w-full mb-12">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="책 제목이나 저자를 검색해보세요"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!e.target.value.trim()) {
                setPage(1)
                setHasMore(true)
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl bg-white placeholder-gray-500
            focus:ring-1 focus:ring-inset focus:ring-gray-400 focus:outline-none
            hover:bg-gray-100 hover:border-gray-500 transition"


          />
        </div>

        {!loading && query.trim() && books.length === 0 && (
          <p className="text-center w-full">검색 결과가 없습니다.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
            />
          ))}

          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <BookCardSkeleton key={`skeleton-${i}`} />
            ))}
          {books.length > 0 &&
            Array.from({
              length: (4 - (books.length % 4)) % 4,
            }).map((_, i) => (
              <div
                key={i}
                className="h-[300px] invisible"
              />
            ))}
        </div>

        <div
          ref={loaderRef}
          className="h-8 flex justify-center items-center mt-4"
        >
          {loading && <p>로딩 중...</p>}
        </div>
      </div>
    </main>
  )
}
