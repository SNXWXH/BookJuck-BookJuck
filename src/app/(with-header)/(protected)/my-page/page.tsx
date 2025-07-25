import Graph from './_components/graph'
import RecentBook from './_components/recent-book'
import StatisticsCard from './_components/statistics-card'
import Link from 'next/link'
import { MonthlyBookType, StatisicType, TagBookType } from './_types'
import { fetchWithAuthOnServer } from '@/lib/fetch-with-auth-server'
import { BookType, ProfileType } from '../_types'

export const dynamic = 'force-dynamic'

export default async function MyPage() {
  let statisicData: StatisicType | null = null
  let monthlyBookData: MonthlyBookType[] | null = null
  let tagBookData: TagBookType[] | null = null
  let recentBookData: BookType[] | null = null
  let profileData: ProfileType | null = null

  try {
    // const cookieStore = await cookies()
    // const accessToken = cookieStore.get('accessToken')?.value
    // if (!accessToken) return

    const results = await Promise.allSettled<
      [
        Promise<StatisicType>,
        Promise<MonthlyBookType[]>,
        Promise<TagBookType[]>,
        Promise<BookType[]>,
        Promise<ProfileType>,
      ]
    >([
      fetchWithAuthOnServer('/api/reading/statistics'),
      fetchWithAuthOnServer('/api/reading/monthly'),
      fetchWithAuthOnServer('/api/reading/tags/statistics'),
      fetchWithAuthOnServer('/api/library/review/recent'),
      fetchWithAuthOnServer('/api/user/profile'),
    ])

    if (results[0].status === 'fulfilled')
      statisicData = results[0].value
    else console.error('통계 데이터 로딩 실패:', results[0].reason)

    if (results[1].status === 'fulfilled')
      monthlyBookData = results[1].value
    else
      console.error(
        '월별 독서량 데이터 로딩 실패:',
        results[1].reason,
      )

    if (results[2].status === 'fulfilled')
      tagBookData = results[2].value
    else
      console.error(
        '태그별 데이터 데이터 로딩 실패:',
        results[2].reason,
      )

    if (results[3].status === 'fulfilled')
      recentBookData = results[3].value
    else
      console.error(
        '최근 읽은 책 데이터 로딩 실패:',
        results[3].reason,
      )

    if (results[4].status === 'fulfilled')
      profileData = results[4].value
    else console.error('프로필 데이터 로딩 실패:', results[4].reason)
  } catch (error) {
    console.error('전체 데이터 로딩 중 오류:', error)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {profileData?.nickName} 님의 독서 통계
            </h1>
            <p className="mt-3 text-gray-600">
              나의 독서 통계와 기록을 확인해보세요
            </p>
          </div>
          <Link
            href="/profile"
            className="px-4 py-2 bg-slate-950 text-white rounded hover:bg-gray-800 hover: cursor-pointer"
          >
            회원 정보
          </Link>
        </section>
        {statisicData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatisticsCard
              title="totalBooks"
              data={statisicData.totalBooks}
            />
            <StatisticsCard
              title="reviewBooks"
              data={statisicData.reviewBooks}
            />
            <StatisticsCard
              title="currentStreak"
              data={statisicData.currentStreak}
            />
            <StatisticsCard
              title="longestStreak"
              data={statisicData.longestStreak}
            />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {monthlyBookData && (
            <Graph
              title="MonthlyGraph"
              data={monthlyBookData}
            />
          )}
          {tagBookData && (
            <Graph
              title="TagGraph"
              data={tagBookData}
            />
          )}
        </div>
        {recentBookData && <RecentBook data={recentBookData} />}
      </div>
    </>
  )
}
