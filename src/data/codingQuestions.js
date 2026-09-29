import basicJava from './coding/basicJava.js'
import strings from './coding/strings.js'
import arrays from './coding/arrays.js'
import collections from './coding/collections.js'
import streams from './coding/streams.js'
import hashmap from './coding/hashmap.js'
import recursion from './coding/recursion.js'
import sorting from './coding/sorting.js'
import searching from './coding/searching.js'
import sql from './coding/sql.js'
import linkedLists from './coding/linkedLists.js'
import trees from './coding/trees.js'
import stacksQueues from './coding/stacksQueues.js'
import graphs from './coding/graphs.js'
import dynamicProgramming from './coding/dynamicProgramming.js'

export const CODING_CATEGORIES = [
  'Basic Java',
  'Strings',
  'Arrays',
  'Collections',
  'Java 8 Streams',
  'HashMap',
  'Recursion',
  'Sorting',
  'Searching',
  'SQL',
  'Linked Lists',
  'Trees & BST',
  'Stacks & Queues',
  'Graphs',
  'Dynamic Programming',
]

export const CODING_DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export const ALL_CODING_QUESTIONS = [
  ...basicJava,
  ...strings,
  ...arrays,
  ...collections,
  ...streams,
  ...hashmap,
  ...recursion,
  ...sorting,
  ...searching,
  ...sql,
  ...linkedLists,
  ...trees,
  ...stacksQueues,
  ...graphs,
  ...dynamicProgramming,
]

export function getCodingQuestion(questionId) {
  return ALL_CODING_QUESTIONS.find((question) => question.id === questionId)
}

export function getCodingQuestionsForTopic(topicId) {
  return ALL_CODING_QUESTIONS.filter((question) => question.topicId === topicId)
}
