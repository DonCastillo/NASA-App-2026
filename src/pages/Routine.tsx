import { format } from 'date-fns'
import { Link } from 'react-router'
import { TONE_TEXT } from '../components/taskTone'
import { taskDisplay, todayTasks, weekAhead, weekCompletion } from '../lib/scheduler'
import { useTasks } from '../state/useTasks'
import type { Task } from '../types'

// The mission routine as a checklist (plan/site-map.md → Routine, plan/tasks.md 6.3). Route: /routine
// Uses the same tasks as the 🔔 bell (useTasks), so the two always agree.

function TaskRow({ task, now }: { task: Task; now: Date }) {
  const display = taskDisplay(task, now)
  const content = (
    <>
      <span aria-hidden className={`w-4 shrink-0 text-center ${TONE_TEXT[display.tone]}`}>
        {display.icon}
      </span>
      <span className="min-w-0 flex-1">{task.title}</span>
      <span className={`reading text-xs font-semibold ${TONE_TEXT[display.tone]}`}>
        {display.word}
        {task.state === 'done' && task.doneAt && ` ${format(new Date(task.doneAt), 'HH:mm')}`}
      </span>
    </>
  )
  const rowClass = 'flex min-h-12 items-center gap-3 px-4 py-2.5 text-sm'
  return (
    <li className="border-b border-space-700 last:border-b-0">
      {task.state === 'done' ? (
        <div className={`${rowClass} text-text-muted`}>{content}</div>
      ) : (
        <Link to={task.link} className={`${rowClass} text-text hover:bg-space-800`}>
          {content}
        </Link>
      )}
    </li>
  )
}

export default function Routine() {
  const { input, tasks } = useTasks()
  const week = weekAhead(input.profile, input.now)
  const { done, total } = weekCompletion(input)

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Routine</h1>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-text-muted">
            <span className="reading font-semibold text-text">
              {done} of {total}
            </span>{' '}
            check-ins and weekly items done in the last 7 days
          </p>
          <div
            role="progressbar"
            aria-label="Done this week"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            className="h-1.5 overflow-hidden rounded-full bg-space-700"
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Today</h2>
        <ul className="rounded-panel border border-space-700 bg-space-900">
          {todayTasks(tasks, input.now).map((task) => (
            <TaskRow key={task.id} task={task} now={input.now} />
          ))}
        </ul>
        <p className="text-xs text-text-muted">
          Suggestions only: do them in any order. Skipped items come back in the next prompt.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">This week</h2>
        {week.length ? (
          <ul className="rounded-panel border border-space-700 bg-space-900">
            {week.map((day) => (
              <li
                key={day.date.toISOString()}
                className="flex gap-4 border-b border-space-700 px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="reading w-24 shrink-0 text-text-muted">
                  {format(day.date, 'EEE d MMM')}
                </span>
                <span className="text-text">{day.items.join(' · ')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">No weekly items before the mission ends.</p>
        )}
        <p className="text-xs text-text-muted">Plus the daily check-in every morning.</p>
      </div>
    </section>
  )
}
