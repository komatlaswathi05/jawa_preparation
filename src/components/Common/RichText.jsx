// Renders study text: blank lines ("\n\n") become paragraphs and `backticks` become inline code.
function InlineCode({ text }) {
  const parts = text.split('`')
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-700">
        {part}
      </code>
    ) : (
      part
    ),
  )
}

function RichText({ text, className = '' }) {
  if (!text) return null
  const paragraphs = text.split(/\n\s*\n/)
  return (
    <div className={`space-y-3 leading-relaxed ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          <InlineCode text={paragraph} />
        </p>
      ))}
    </div>
  )
}

export { InlineCode }
export default RichText
