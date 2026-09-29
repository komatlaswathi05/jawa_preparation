import { useEffect } from 'react'
import { useParams } from 'react-router'
import Breadcrumbs from '../components/Common/Breadcrumbs.jsx'
import PreviousNextNavigation from '../components/Study/PreviousNextNavigation.jsx'
import TopicContent from '../components/Study/TopicContent.jsx'
import TopicHeader from '../components/Study/TopicHeader.jsx'
import { getCategory, getTopic } from '../data/categories.js'
import { getCodingQuestionsForTopic } from '../data/codingQuestions.js'
import { recordStudyActivity, setLastTopic } from '../utils/progressUtils.js'
import NotFound from './NotFound.jsx'

function Topic() {
  const { topicId } = useParams()
  const topic = getTopic(topicId)

  // Remember the last visited topic and count today as a study day.
  useEffect(() => {
    if (!topic) return
    setLastTopic(topic.id)
    recordStudyActivity()
  }, [topic])

  if (!topic) return <NotFound />

  const category = getCategory(topic.category)

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: category.name, to: category.path },
            { label: topic.title },
          ]}
        />
        <TopicHeader topic={topic} category={category} />
      </div>

      <TopicContent topic={topic} codingQuestions={getCodingQuestionsForTopic(topic.id)} />

      <div className="border-t border-slate-200 pt-6">
        <PreviousNextNavigation topicId={topic.id} />
      </div>
    </div>
  )
}

export default Topic
