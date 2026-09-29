import { Lightbulb } from 'lucide-react'

function KeyPoints({ points, title = 'Important points' }) {
  if (!points?.length) return null
  return (
    <div className="rounded-lg bg-amber-50 p-4">
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <Lightbulb className="size-4" aria-hidden="true" /> {title}
      </h4>
      <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  )
}

export default KeyPoints
