import { Bookmark } from 'lucide-react'
import { useState } from 'react'
import Breadcrumbs from '../components/Common/Breadcrumbs.jsx'
import Button from '../components/Common/Button.jsx'
import EmptyState from '../components/Common/EmptyState.jsx'
import PageHeader from '../components/Common/PageHeader.jsx'
import Tabs from '../components/Common/Tabs.jsx'
import CodingQuestion from '../components/Study/CodingQuestion.jsx'
import InterviewQuestion from '../components/Study/InterviewQuestion.jsx'
import TopicCard from '../components/Study/TopicCard.jsx'
import { getTopic } from '../data/categories.js'
import { getCodingQuestion } from '../data/codingQuestions.js'
import { getInterviewQuestion } from '../data/interviewQuestions.js'
import useBookmarks from '../hooks/useBookmarks.js'

// Turns stored bookmark ids back into the full study items (skipping any that no longer exist).
function resolve(bookmarks, type, getItem) {
  return bookmarks
    .filter((bookmark) => bookmark.type === type)
    .map((bookmark) => getItem(bookmark.id))
    .filter(Boolean)
}

function Bookmarks() {
  const { bookmarks } = useBookmarks()
  const [tab, setTab] = useState('topic')

  const topics = resolve(bookmarks, 'topic', getTopic)
  const questions = resolve(bookmarks, 'question', getInterviewQuestion)
  const coding = resolve(bookmarks, 'coding', getCodingQuestion)

  const tabs = [
    { id: 'topic', label: 'Topics', count: topics.length },
    { id: 'question', label: 'Interview Questions', count: questions.length },
    { id: 'coding', label: 'Coding Questions', count: coding.length },
  ]
  const isEmpty = { topic: topics, question: questions, coding }[tab].length === 0

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Bookmarks' }]} />
      <PageHeader
        icon={Bookmark}
        title="Bookmarks"
        description="Topics and questions you saved for later. Use the bookmark icon anywhere to add more."
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-6" />

      {isEmpty ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing bookmarked here yet"
          description="Click the bookmark icon on a topic, interview question or coding question to save it."
          action={
            <Button variant="secondary" to="/">
              Browse topics
            </Button>
          }
        />
      ) : (
        <>
          {tab === 'topic' && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topics.map((topic, index) => (
                <TopicCard key={topic.id} topic={topic} number={index + 1} />
              ))}
            </div>
          )}
          {tab === 'question' && (
            <div className="space-y-3">
              {questions.map((question) => (
                <InterviewQuestion key={question.id} question={question} showTopic />
              ))}
            </div>
          )}
          {tab === 'coding' && (
            <div className="space-y-3">
              {coding.map((question) => (
                <CodingQuestion key={question.id} question={question} showCategory />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Bookmarks
