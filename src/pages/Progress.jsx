import { BookOpen, ChartColumn, CircleCheck, Code, Flame, ListChecks, MessageSquare, RotateCcw, Trophy } from 'lucide-react'
import { useCallback, useState } from 'react'
import Breadcrumbs from '../components/Common/Breadcrumbs.jsx'
import Button from '../components/Common/Button.jsx'
import Card from '../components/Common/Card.jsx'
import Modal from '../components/Common/Modal.jsx'
import PageHeader from '../components/Common/PageHeader.jsx'
import StatsCard from '../components/Dashboard/StatsCard.jsx'
import ProgressBar from '../components/Progress/ProgressBar.jsx'
import ProgressOverview from '../components/Progress/ProgressOverview.jsx'
import useProgressStats from '../hooks/useProgressStats.js'
import useStudyActivity from '../hooks/useStudyActivity.js'
import useStudyProgress from '../hooks/useStudyProgress.js'
import { getRecentActivity } from '../utils/progressUtils.js'

function StudyStreak() {
  const { activity, currentStreak, longestStreak, activeDays } = useStudyActivity()
  const days = getRecentActivity(activity, 28)

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Flame className="size-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-slate-900">Study Streak</h2>
      </div>
      <p className="mt-3 text-4xl font-bold text-slate-900">
        {currentStreak} <span className="text-base font-medium text-slate-500">day{currentStreak === 1 ? '' : 's'}</span>
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Longest streak: {longestStreak} · Days studied: {activeDays}
      </p>

      <p className="mt-5 mb-2 text-xs font-medium text-slate-500">Last 4 weeks</p>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <div
            key={day.key}
            title={`${day.date.toLocaleDateString()}${day.active ? ' — studied' : ''}`}
            className={`aspect-square rounded-md ${day.active ? 'bg-orange-400' : 'bg-slate-100'}`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        A day counts when you open a topic, complete a topic, review a question or finish a mock interview.
      </p>
    </Card>
  )
}

function Progress() {
  const stats = useProgressStats()
  const { resetProgress } = useStudyProgress()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const closeConfirm = useCallback(() => setConfirmOpen(false), [])

  const handleReset = () => {
    resetProgress()
    setConfirmOpen(false)
  }

  const totalQuestions = stats.totalInterviewQuestions + stats.totalCodingQuestions
  const completedQuestions = stats.reviewedQuestions + stats.solvedCoding

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Progress' }]} />
      <PageHeader
        icon={ChartColumn}
        title="Your Progress"
        description="Everything is saved in this browser, so your progress stays after refreshing or restarting."
        actions={
          <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirmOpen(true)}>
            Reset Progress
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Overall Progress</h2>
        </div>
        <ProgressBar value={stats.overallPercent} size="lg" className="mt-4" />
        <p className="mt-2 text-sm text-slate-500">
          {stats.completedTopics} of {stats.totalTopics} topics completed
        </p>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Completed topics" value={stats.completedTopics} icon={CircleCheck} tone="green" />
        <StatsCard label="Remaining topics" value={stats.remainingTopics} icon={ListChecks} tone="amber" />
        <StatsCard label="Completed questions" value={completedQuestions} icon={BookOpen} tone="indigo" />
        <StatsCard label="Remaining questions" value={totalQuestions - completedQuestions} icon={MessageSquare} tone="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <ProgressOverview />
        <div className="space-y-6">
          <StudyStreak />
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Question practice</h2>
            <div className="space-y-5">
              <div>
                <ProgressBar label="Interview questions reviewed" value={stats.interviewPercent} />
                <p className="mt-1 text-xs text-slate-500">
                  {stats.reviewedQuestions} / {stats.totalInterviewQuestions}
                </p>
              </div>
              <div>
                <ProgressBar label="Coding questions solved" value={stats.codingPercent} color="sky" />
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Code className="size-3.5" /> {stats.solvedCoding} / {stats.totalCodingQuestions}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title="Reset progress"
        onClose={closeConfirm}
        actions={
          <>
            <Button variant="secondary" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Reset
            </Button>
          </>
        }
      >
        <p>Are you sure you want to reset all your study progress?</p>
        <p className="mt-2 text-slate-500">
          Completed topics, reviewed questions, solved coding questions, study streak and mock interview history will be
          cleared. Bookmarks are kept.
        </p>
      </Modal>
    </div>
  )
}

export default Progress
