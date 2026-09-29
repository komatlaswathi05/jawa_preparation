import { Link } from 'react-router'
import useProgressStats from '../../hooks/useProgressStats.js'
import Card from '../Common/Card.jsx'
import ProgressBar from './ProgressBar.jsx'

// Progress bars for every category plus coding practice.
function ProgressOverview() {
  const { categories, codingPercent, solvedCoding, totalCodingQuestions } = useProgressStats()

  return (
    <Card>
      <h2 className="mb-5 text-lg font-semibold text-slate-900">Progress by category</h2>
      <div className="space-y-5">
        {categories.map((category) => (
          <Link key={category.id} to={category.path} className="group block">
            <ProgressBar label={category.shortName ?? category.name} value={category.percent} />
            <p className="mt-1 text-xs text-slate-500 group-hover:text-indigo-600">
              {category.completed} / {category.total} topics
            </p>
          </Link>
        ))}
        <Link to="/coding-questions" className="group block">
          <ProgressBar label="Coding" value={codingPercent} color="sky" />
          <p className="mt-1 text-xs text-slate-500 group-hover:text-indigo-600">
            {solvedCoding} / {totalCodingQuestions} coding questions solved
          </p>
        </Link>
      </div>
    </Card>
  )
}

export default ProgressOverview
