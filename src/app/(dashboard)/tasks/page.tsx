import { getSchedules } from '@/lib/dal'
import { TaskListView } from '@/components/schedule/TaskListView'

export default async function TasksPage() {
  const schedules = await getSchedules()
  return <TaskListView schedules={schedules} />
}
