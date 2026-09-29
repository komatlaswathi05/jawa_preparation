import { Code } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import Breadcrumbs from '../components/Common/Breadcrumbs.jsx'
import Card from '../components/Common/Card.jsx'
import EmptyState from '../components/Common/EmptyState.jsx'
import FilterChips from '../components/Common/FilterChips.jsx'
import PageHeader from '../components/Common/PageHeader.jsx'
import Tabs from '../components/Common/Tabs.jsx'
import ProgressBar from '../components/Progress/ProgressBar.jsx'
import CodingQuestion from '../components/Study/CodingQuestion.jsx'
import { ALL_CODING_QUESTIONS, CODING_CATEGORIES, CODING_DIFFICULTIES } from '../data/codingQuestions.js'
import useStudyProgress from '../hooks/useStudyProgress.js'

const TABS = [
  { id: 'All', label: 'All', count: ALL_CODING_QUESTIONS.length },
  ...CODING_CATEGORIES.map((category) => ({
    id: category,
    label: category,
    count: ALL_CODING_QUESTIONS.filter((q) => q.category === category).length,
  })),
]

function CodingQuestions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { hash } = useLocation()
  const [difficulty, setDifficulty] = useState('All')
  const { isCodingSolved } = useStudyProgress()

  const category = CODING_CATEGORIES.includes(searchParams.get('category')) ? searchParams.get('category') : 'All'
  const questions = ALL_CODING_QUESTIONS.filter(
    (q) => (category === 'All' || q.category === category) && (difficulty === 'All' || q.difficulty === difficulty),
  )
  const solved = questions.filter((q) => isCodingSolved(q.id)).length

  const changeCategory = (id) => setSearchParams(id === 'All' ? {} : { category: id })

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Coding Questions' }]} />
      <PageHeader
        icon={Code}
        title="Java Coding Questions"
        description="Classic interview problems with explanations, Java solutions and complexity analysis."
      />

      <Tabs tabs={TABS} value={category} onChange={changeCategory} className="mb-5" />

      <Card className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <FilterChips
          label="Difficulty"
          options={['All', ...CODING_DIFFICULTIES]}
          value={difficulty}
          onChange={setDifficulty}
        />
        <div className="w-full md:w-72">
          <ProgressBar
            label={`${solved} / ${questions.length} solved`}
            value={questions.length ? (solved / questions.length) * 100 : 0}
            color="sky"
          />
        </div>
      </Card>

      {questions.length === 0 ? (
        <EmptyState icon={Code} title="No coding questions match this filter" />
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => {
            const targeted = hash === `#${question.id}`
            return (
              <CodingQuestion
                key={targeted ? `${question.id}-open` : question.id}
                question={question}
                index={index}
                defaultOpen={targeted}
                showCategory={category === 'All'}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CodingQuestions
