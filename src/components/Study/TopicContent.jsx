import { BookOpen, Code, Lightbulb, ListChecks, MessageSquare, Target, TriangleAlert } from 'lucide-react'
import { useLocation } from 'react-router'
import Card from '../Common/Card.jsx'
import CodeBlock from '../Common/CodeBlock.jsx'
import RichText from '../Common/RichText.jsx'
import CodingQuestion from './CodingQuestion.jsx'
import InterviewQuestion from './InterviewQuestion.jsx'
import JwtFlowDiagram from './JwtFlowDiagram.jsx'
import SectionHeading from './SectionHeading.jsx'

const DIAGRAMS = {
  'jwt-flow': JwtFlowDiagram,
}

function Concept({ subtopic, number }) {
  return (
    <Card id={subtopic.id} padding="p-5 sm:p-6">
      <h3 className="flex items-baseline gap-2 text-lg font-semibold text-slate-900">
        <span className="text-sm font-medium text-indigo-500">{number}.</span>
        {subtopic.title}
      </h3>
      <RichText text={subtopic.explanation} className="mt-2 text-slate-700" />
      {subtopic.example && (
        <div className="mt-4">
          <CodeBlock code={subtopic.example} />
        </div>
      )}
      {subtopic.interviewPoints?.length > 0 && (
        <div className="mt-4 rounded-lg bg-indigo-50/70 p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-indigo-900">
            <Lightbulb className="size-4" /> Interview points
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-indigo-900">
            {subtopic.interviewPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function TipList({ items, tone }) {
  const styles =
    tone === 'warning'
      ? { card: 'border-amber-200 bg-amber-50', text: 'text-amber-900', dot: 'bg-amber-500' }
      : { card: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-900', dot: 'bg-emerald-500' }
  return (
    <ul className={`space-y-2.5 rounded-xl border p-5 ${styles.card}`}>
      {items.map((item) => (
        <li key={item} className={`flex gap-3 text-sm leading-relaxed ${styles.text}`}>
          <span className={`mt-2 size-1.5 shrink-0 rounded-full ${styles.dot}`} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function TopicContent({ topic, codingQuestions }) {
  const { hash } = useLocation()
  const Diagram = topic.diagram ? DIAGRAMS[topic.diagram] : null

  return (
    <div className="space-y-10">
      <section>
        <SectionHeading id="overview" icon={BookOpen} title="Overview" />
        <Card padding="p-5 sm:p-6">
          <h3 className="mb-2 font-semibold text-slate-900">What is {topic.title}?</h3>
          <RichText text={topic.overview} className="text-slate-700" />
        </Card>
      </section>

      <section>
        <SectionHeading id="topics-to-learn" icon={ListChecks} title="Topics to Learn" count={topic.subtopics.length} />
        <Card padding="p-3 sm:p-4">
          <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {topic.subtopics.map((subtopic, index) => (
              <li key={subtopic.id}>
                <a
                  href={`#${subtopic.id}`}
                  className="flex items-baseline gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-indigo-700"
                >
                  <span className="w-5 shrink-0 text-right text-xs text-slate-400 tabular-nums">{index + 1}.</span>
                  {subtopic.title}
                </a>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section>
        <SectionHeading id="concepts" icon={Lightbulb} title="Important Concepts" />
        <div className="space-y-4">
          {topic.subtopics.map((subtopic, index) => (
            <Concept key={subtopic.id} subtopic={subtopic} number={index + 1} />
          ))}
        </div>
      </section>

      {Diagram && (
        <section>
          <Diagram />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading id="common-mistakes" icon={TriangleAlert} title="Common Mistakes" />
          <TipList items={topic.commonMistakes} tone="warning" />
        </section>
        <section>
          <SectionHeading id="interview-tips" icon={Target} title="Interview Tips" />
          <TipList items={topic.interviewTips} tone="success" />
        </section>
      </div>

      <section>
        <SectionHeading
          id="interview-questions"
          icon={MessageSquare}
          title="Interview Questions"
          count={topic.interviewQuestions.length}
        />
        <div className="space-y-3">
          {topic.interviewQuestions.map((question, index) => {
            const targeted = hash === `#${question.id}`
            // Changing the key re-mounts the question so it opens when a search result points at it.
            return (
              <InterviewQuestion
                key={targeted ? `${question.id}-open` : question.id}
                question={question}
                index={index}
                defaultOpen={targeted}
              />
            )
          })}
        </div>
      </section>

      {codingQuestions.length > 0 && (
        <section>
          <SectionHeading id="coding-questions" icon={Code} title="Coding Questions" count={codingQuestions.length} />
          <div className="space-y-3">
            {codingQuestions.map((question, index) => (
              <CodingQuestion key={question.id} question={question} index={index} showCategory />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default TopicContent
