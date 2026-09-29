import { getCategory } from '../../data/categories.js'
import useStudyProgress from '../../hooks/useStudyProgress.js'
import { countCompleted } from '../../utils/progressUtils.js'
import Breadcrumbs from '../Common/Breadcrumbs.jsx'
import Card from '../Common/Card.jsx'
import PageHeader from '../Common/PageHeader.jsx'
import ProgressBar from '../Progress/ProgressBar.jsx'
import TopicCard from './TopicCard.jsx'

// Shared layout for the category pages (Java, SQL, Spring, ...).
function CategoryOverview({ categoryId }) {
  const category = getCategory(categoryId)
  const { completedTopics, getProgress } = useStudyProgress()
  const topicIds = category.topics.map((topic) => topic.id)
  const questionCount = category.topics.reduce((sum, topic) => sum + topic.interviewQuestions.length, 0)

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: category.name }]} />
      <PageHeader icon={category.icon} title={category.name} description={category.description} />

      <Card className="mb-6">
        <ProgressBar label={`${category.shortName ?? category.name} progress`} value={getProgress(topicIds)} size="lg" />
        <p className="mt-2 text-sm text-slate-500">
          {countCompleted(topicIds, completedTopics)} of {topicIds.length} topics completed · {questionCount}{' '}
          interview questions
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {category.topics.map((topic, index) => (
          <TopicCard key={topic.id} topic={topic} number={index + 1} />
        ))}
      </div>
    </div>
  )
}

export default CategoryOverview
