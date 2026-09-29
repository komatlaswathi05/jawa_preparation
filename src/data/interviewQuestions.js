import { ALL_TOPICS } from './categories.js'

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

// Question banks group topic categories for the Interview Questions page and the Mock Interview.
export const QUESTION_BANKS = [
  { id: 'java', label: 'Java', categories: ['java'] },
  {
    id: 'spring-boot',
    label: 'Spring Boot',
    categories: ['spring', 'spring-boot', 'jpa', 'security', 'testing', 'microservices'],
  },
  { id: 'sql', label: 'SQL', categories: ['sql'] },
]

// Every interview question from every topic, tagged with the topic it belongs to.
export const ALL_INTERVIEW_QUESTIONS = ALL_TOPICS.flatMap((topic) =>
  topic.interviewQuestions.map((question) => ({
    ...question,
    topicId: topic.id,
    topicTitle: topic.title,
    category: topic.category,
  })),
)

export function getQuestionBank(bankId) {
  return QUESTION_BANKS.find((bank) => bank.id === bankId)
}

// bankId can be 'java', 'spring-boot', 'sql' or 'mixed' (all questions).
export function getInterviewQuestions(bankId = 'mixed', difficulty = 'All') {
  const bank = getQuestionBank(bankId)
  return ALL_INTERVIEW_QUESTIONS.filter(
    (question) =>
      (!bank || bank.categories.includes(question.category)) &&
      (difficulty === 'All' || question.difficulty === difficulty),
  )
}

export function getInterviewQuestion(questionId) {
  return ALL_INTERVIEW_QUESTIONS.find((question) => question.id === questionId)
}
