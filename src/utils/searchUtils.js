import { ALL_TOPICS, getCategory } from '../data/categories.js'
import { ALL_CODING_QUESTIONS } from '../data/codingQuestions.js'

export const RESULT_TYPES = {
  topic: 'Topics',
  concept: 'Concepts',
  question: 'Interview Questions',
  coding: 'Coding Questions',
}

// Build the search index once. Each entry knows where clicking it should navigate.
const SEARCH_INDEX = [
  ...ALL_TOPICS.flatMap((topic) => {
    const categoryName = getCategory(topic.category)?.name ?? ''
    return [
      {
        type: 'topic',
        title: topic.title,
        subtitle: categoryName,
        to: `/topics/${topic.id}`,
        // Include concept titles so "HashMap" also finds the Java Collections topic.
        text: `${topic.title} ${topic.description} ${categoryName} ${topic.subtopics.map((s) => s.title).join(' ')}`,
      },
      ...topic.subtopics.map((subtopic) => ({
        type: 'concept',
        title: subtopic.title,
        subtitle: topic.title,
        to: `/topics/${topic.id}#${subtopic.id}`,
        text: `${subtopic.title} ${subtopic.explanation}`,
      })),
      ...topic.interviewQuestions.map((question) => ({
        type: 'question',
        title: question.question,
        subtitle: `${topic.title} · ${question.difficulty}`,
        to: `/topics/${topic.id}#${question.id}`,
        text: question.question,
      })),
    ]
  }),
  ...ALL_CODING_QUESTIONS.map((question) => ({
    type: 'coding',
    title: question.title,
    subtitle: `${question.category} · ${question.difficulty}`,
    to: `/coding-questions#${question.id}`,
    text: `${question.title} ${question.category} ${question.problem}`,
  })),
].map((entry) => ({
  ...entry,
  titleLower: entry.title.toLowerCase(),
  textLower: entry.text.toLowerCase(),
}))

// Returns matching entries: every word of the query must appear.
// Title matches are ranked above matches found only in the body text.
export function search(query, limitPerType = 6) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const scored = []
  for (const entry of SEARCH_INDEX) {
    if (!words.every((word) => entry.textLower.includes(word) || entry.titleLower.includes(word))) continue
    const titleHits = words.filter((word) => entry.titleLower.includes(word)).length
    const startsWith = entry.titleLower.startsWith(words[0]) ? 1 : 0
    scored.push({ entry, score: titleHits * 2 + startsWith })
  }
  scored.sort((a, b) => b.score - a.score)

  const counts = {}
  const results = []
  for (const { entry } of scored) {
    counts[entry.type] = (counts[entry.type] ?? 0) + 1
    if (counts[entry.type] <= limitPerType) results.push(entry)
  }

  // Keep results grouped in a fixed order: topics, concepts, questions, coding.
  const order = Object.keys(RESULT_TYPES)
  return results.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
}
