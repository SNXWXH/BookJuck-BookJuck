interface RecentBookItemPropsType {
  title: string
  author: string
  date: string
  rating: number
}

export default function RecentBookItem({
  title,
  author,
  date = '',
  rating,
}: RecentBookItemPropsType) {
  return (
    <div className="flex justify-between items-center h-24 bg-blue-50/50 rounded-lg px-2 md:px-6">
      <div className="w-3/5">
        <p className="font-bold truncate">{title}</p>
        <p className="text-sm text-gray-600 truncate">{author}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <div className="flex justify-end">
        <span className="text-yellow-500">{'★'.repeat(rating)}</span>
        <span className="text-gray-300">
          {'★'.repeat(5 - rating)}
        </span>
      </div>
    </div>
  )
}
