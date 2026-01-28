import { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'

export default function DateTime() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = () => {
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    return `${year}年${month}月${day}日`
  }

  const formatWeekday = () => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[now.getDay()]
  }

  const formatTime = () => {
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <div className="flex items-center gap-4 text-stone-600">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-terracotta-500" />
        <span className="text-sm font-medium">{formatDate()}</span>
        <span className="text-sm text-stone-400">{formatWeekday()}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-terracotta-500" />
        <span className="text-sm font-medium tabular-nums">{formatTime()}</span>
      </div>
    </div>
  )
}