import { MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import Breadcrumbs from '../components/Common/Breadcrumbs.jsx'
import Card from '../components/Common/Card.jsx'
import EmptyState from '../components/Common/EmptyState.jsx'
import FilterChips from '../components/Common/FilterChips.jsx'
import PageHeader from '../components/Common/PageHeader.jsx'
import Tabs from '../components/Common/Tabs.jsx'
import ProgressBar from '../components/Progress/ProgressBar.jsx'
import InterviewQuestion from '../components/Study/InterviewQuestion.jsx'
import { DIFFICULTIES, getInterviewQuestions, QUESTION_BANKS } from '../data/interviewQuestions.js'
import useStudyProgress from '../hooks/useStudyProgress.js'

const TABS = [...QUESTION_BANKS.map((bank) => ({ id: bank.id, label: bank.label })), { id: 'mixed', label: 'All' }]

// Groups questions by topic, keeping curriculum order.
function groupByTopic(questions) {
  const groups = []
  for (const question of questions) {
    const last = groups[groups.length - 1]
    if (last && last.topicId === question.topicId) last.questions.push(question)
    else groups.push({ topicId: question.topicId, topicTitle: question.topicTitle, questions: [question] })
  }
  return groups
}

function InterviewQuestions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [difficulty, setDifficulty] = useState('All')
  const { isQuestionReviewed } = useStudyProgress()

  const bank = TABS.some((tab) => tab.id === searchParams.get('bank')) ? searchParams.get('bank') : 'java'
  const questions = getInterviewQuestions(bank, difficulty)
  const reviewed = questions.filter((q) => isQuestionReviewed(q.id)).length
  const tabs = TABS.map((tab) => ({ ...tab, count: getInterviewQuestions(tab.id).length }))

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Interview Questions' }]} />
      <PageHeader
        icon={MessageSquare}
        title="Interview Questions"
        description="Answer each question in your own words first, then open it to compare with the model answer."
      />

      <Tabs tabs={tabs} value={bank} onChange={(id) => setSearchParams({ bank: id })} className="mb-5" />

      <Card className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <FilterChips label="Difficulty" options={['All', ...DIFFICULTIES]} value={difficulty} onChange={setDifficulty} />
        <div className="w-full md:w-72">
          <ProgressBar
            label={`${reviewed} / ${questions.length} reviewed`}
            value={questions.length ? (reviewed / questions.length) * 100 : 0}
          />
        </div>
      </Card>

      {questions.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No questions match this filter" />
      ) : (
        <div className="space-y-8">
          {groupByTopic(questions).map((group) => (
            <section key={group.topicId}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">{group.topicTitle}</h2>
              <div className="space-y-3">
                {group.questions.map((question) => (
                  <InterviewQuestion key={question.id} question={question} showTopic />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default InterviewQuestions
