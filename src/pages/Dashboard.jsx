import { BookOpen, CircleCheck, Code, Flame, ListChecks, MessageSquare, Rocket, Target } from 'lucide-react'
import { Link } from 'react-router'
import ContinueLearning from '../components/Dashboard/ContinueLearning.jsx'
import ProgressCard from '../components/Dashboard/ProgressCard.jsx'
import StatsCard from '../components/Dashboard/StatsCard.jsx'
import Card from '../components/Common/Card.jsx'
import ProgressBar from '../components/Progress/ProgressBar.jsx'
import useProgressStats from '../hooks/useProgressStats.js'
import useStudyActivity from '../hooks/useStudyActivity.js'

const DASHBOARD_CATEGORIES = ['java', 'sql', 'spring', 'spring-boot']

function Dashboard() {
  const stats = useProgressStats()
  const { currentStreak } = useStudyActivity()
  const progressCards = DASHBOARD_CATEGORIES.map((id) => stats.categories.find((c) => c.id === id))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Java & Spring Boot Interview Preparation
        </h1>
        <p className="mt-1 text-slate-500">
          Learn Java, Spring Boot and SQL step by step, then practise real interview questions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ContinueLearning />
        <Card className="flex flex-col justify-center">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Overall Progress</h2>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-600">
              <Flame className="size-4" /> {currentStreak} day streak
            </span>
          </div>
          <p className="text-4xl font-bold text-slate-900 tabular-nums">{stats.overallPercent}%</p>
          <ProgressBar value={stats.overallPercent} showValue={false} size="lg" className="mt-3" />
          <p className="mt-2 text-sm text-slate-500">
            {stats.completedTopics} of {stats.totalTopics} topics completed
          </p>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Your progress</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {progressCards.map((card) => (
            <ProgressCard
              key={card.id}
              title={card.shortName ?? card.name}
              percent={card.percent}
              detail={`${card.completed} / ${card.total} topics`}
              icon={card.icon}
              to={card.path}
            />
          ))}
          <ProgressCard
            title="Interview Preparation"
            percent={stats.interviewPrepPercent}
            detail={`${stats.reviewedQuestions + stats.solvedCoding} questions practised`}
            icon={Target}
            to="/interview-questions"
          />
          <ProgressCard
            title="Overall"
            percent={stats.overallPercent}
            detail={`${stats.completedTopics} / ${stats.totalTopics} topics`}
            icon={Rocket}
            to="/progress"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Statistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard label="Total topics" value={stats.totalTopics} icon={BookOpen} />
          <StatsCard label="Completed topics" value={stats.completedTopics} icon={CircleCheck} tone="green" />
          <StatsCard label="Remaining topics" value={stats.remainingTopics} icon={ListChecks} tone="amber" />
          <StatsCard
            label="Total interview questions"
            value={stats.totalInterviewQuestions}
            icon={MessageSquare}
            tone="sky"
          />
          <StatsCard label="Total coding questions" value={stats.totalCodingQuestions} icon={Code} tone="slate" />
          <StatsCard label="Completed coding questions" value={stats.solvedCoding} icon={CircleCheck} tone="green" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Browse the curriculum</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.categories.map(({ id, name, path, icon: Icon, description, completed, total, percent }) => (
            <Link
              key={id}
              to={path}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300"
            >
              <Icon className="size-6 text-indigo-600" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-indigo-700">{name}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">{description}</p>
              <ProgressBar value={percent} size="sm" showValue={false} className="mt-4" />
              <p className="mt-1.5 text-xs text-slate-500">
                {completed} / {total} topics · {percent}%
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
