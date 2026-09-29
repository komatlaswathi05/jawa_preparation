import Badge, { DifficultyBadge } from '../Common/Badge.jsx'
import BookmarkButton from '../Common/BookmarkButton.jsx'
import Card from '../Common/Card.jsx'
import CompletionButton from './CompletionButton.jsx'
import TopicProgress from './TopicProgress.jsx'

function TopicHeader({ topic, category }) {
  return (
    <Card padding="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color="indigo">{category.name}</Badge>
        <DifficultyBadge level={topic.difficulty} />
        <Badge>{topic.subtopics.length} concepts</Badge>
        <Badge>{topic.interviewQuestions.length} interview questions</Badge>
      </div>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{topic.title}</h1>
      <p className="mt-1.5 text-slate-500">{topic.description}</p>

      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <TopicProgress topic={topic} />
        <div className="flex flex-wrap items-center gap-2">
          <CompletionButton topicId={topic.id} />
          <BookmarkButton type="topic" id={topic.id} showLabel />
        </div>
      </div>
    </Card>
  )
}

export default TopicHeader
