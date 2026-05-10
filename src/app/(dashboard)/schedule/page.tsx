import { getSchedules } from '@/lib/dal'
import { ScheduleDashboard } from '@/components/schedule/ScheduleDashboard'

export default async function SchedulePage() {
  const schedules = await getSchedules()
  return (
    <div className="mx-auto w-full max-w-full">
      <ScheduleDashboard schedules={schedules} />
    </div>
  )
}
