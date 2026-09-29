import Card from '../Common/Card.jsx'
import CodeBlock from '../Common/CodeBlock.jsx'
import KeyPoints from '../Common/KeyPoints.jsx'
import RichText from '../Common/RichText.jsx'

function AnswerSection({ question }) {
  return (
    <Card padding="p-5 sm:p-7" className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">Answer</h3>
        <RichText text={question.answer} className="text-slate-700" />
      </div>
      {question.example && <CodeBlock code={question.example} />}
      <KeyPoints points={question.points} />
    </Card>
  )
}

export default AnswerSection
