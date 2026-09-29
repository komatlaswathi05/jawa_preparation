import { CircleCheck, CircleX, Eye, Play, RotateCcw, ThumbsDown, ThumbsUp, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { DIFFICULTIES, getInterviewQuestions, QUESTION_BANKS } from '../../data/interviewQuestions.js'
import useLocalStorage from '../../hooks/useLocalStorage.js'
import { EMPTY_LIST, saveMockInterviewResult } from '../../utils/progressUtils.js'
import { STORAGE_KEYS } from '../../utils/storageUtils.js'
import Button from '../Common/Button.jsx'
import Card from '../Common/Card.jsx'
import FilterChips from '../Common/FilterChips.jsx'
import ProgressBar from '../Progress/ProgressBar.jsx'
import AnswerSection from './AnswerSection.jsx'
import QuestionCard from './QuestionCard.jsx'

const BANK_OPTIONS = [
  ...QUESTION_BANKS.map((bank) => ({ id: bank.id, label: bank.label })),
  { id: 'mixed', label: 'Mixed' },
]
const BANK_DESCRIPTIONS = {
  java: 'Core Java, OOP, collections, concurrency, JVM',
  'spring-boot': 'Spring, Spring Boot, JPA, Security, Testing, Microservices',
  sql: 'Queries, joins, indexes, transactions, normalization',
  mixed: 'A bit of everything',
}
const QUESTION_COUNTS = [5, 10, 15]

// Fisher–Yates shuffle, then take the first `count` items.
function pickRandom(items, count) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy.slice(0, count)
}

function bankLabel(bankId) {
  return BANK_OPTIONS.find((bank) => bank.id === bankId)?.label ?? bankId
}

function Setup({ settings, onChange, onStart }) {
  const available = getInterviewQuestions(settings.bank, settings.difficulty).length
  const questionCount = Math.min(settings.count, available)

  return (
    <Card padding="p-5 sm:p-7" className="space-y-7">
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">1. Choose a subject</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BANK_OPTIONS.map((bank) => {
            const active = settings.bank === bank.id
            return (
              <button
                key={bank.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...settings, bank: bank.id })}
                className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${
                  active ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold text-slate-900">{bank.label}</p>
                <p className="mt-1 text-xs text-slate-500">{BANK_DESCRIPTIONS[bank.id]}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900">2. Choose a difficulty</h2>
        <FilterChips
          options={DIFFICULTIES}
          value={settings.difficulty}
          onChange={(difficulty) => onChange({ ...settings, difficulty })}
        />
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900">3. Number of questions</h2>
        <FilterChips
          options={QUESTION_COUNTS}
          value={settings.count}
          onChange={(count) => onChange({ ...settings, count })}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {available === 0
            ? 'No questions match these settings.'
            : `${available} matching questions in the bank. You will get ${questionCount} random ones.`}
        </p>
        <Button size="lg" icon={Play} disabled={available === 0} onClick={() => onStart(questionCount)}>
          Start Interview
        </Button>
      </div>
    </Card>
  )
}

function Results({ questions, answers, settings, onRestart, onChangeSettings }) {
  const correct = answers.filter((answer) => answer === true).length
  const incorrect = questions.length - correct
  const percentage = Math.round((correct / questions.length) * 100)
  const message =
    percentage >= 80 ? 'Excellent — you are interview ready!' : percentage >= 50 ? 'Good job — keep practising.' : 'Keep going — review the topics below and try again.'

  return (
    <div className="space-y-6">
      <Card padding="p-6 sm:p-8" className="text-center">
        <Trophy className="mx-auto size-12 text-amber-500" />
        <h2 className="mt-3 text-2xl font-bold text-slate-900">Interview finished</h2>
        <p className="mt-1 text-slate-500">
          {bankLabel(settings.bank)} · {settings.difficulty}
        </p>
        <p className="mt-2 font-medium text-slate-700">{message}</p>

        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-900">
              {correct}/{questions.length}
            </p>
            <p className="text-xs text-slate-500">Score</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-2xl font-bold text-emerald-700">{correct}</p>
            <p className="text-xs text-emerald-700">Correct answers</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4">
            <p className="text-2xl font-bold text-rose-700">{incorrect}</p>
            <p className="text-xs text-rose-700">Incorrect answers</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-2xl font-bold text-indigo-700">{percentage}%</p>
            <p className="text-xs text-indigo-700">Percentage</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button icon={RotateCcw} onClick={onRestart}>
            Try again with new questions
          </Button>
          <Button variant="secondary" onClick={onChangeSettings}>
            Change settings
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-900">Review</h3>
        <ul className="divide-y divide-slate-100">
          {questions.map((question, index) => (
            <li key={question.id} className="flex items-start gap-3 py-3">
              {answers[index] ? (
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-label="Correct" />
              ) : (
                <CircleX className="mt-0.5 size-5 shrink-0 text-rose-500" aria-label="Incorrect" />
              )}
              <div className="min-w-0">
                <Link
                  to={`/topics/${question.topicId}#${question.id}`}
                  className="font-medium text-slate-800 hover:text-indigo-700"
                >
                  {question.question}
                </Link>
                <p className="text-xs text-slate-500">{question.topicTitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function History() {
  const [history] = useLocalStorage(STORAGE_KEYS.MOCK_HISTORY, EMPTY_LIST)
  if (history.length === 0) return null

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-900">Recent mock interviews</h2>
      <ul className="divide-y divide-slate-100">
        {history.slice(0, 5).map((result) => (
          <li key={result.date} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-slate-800">
                {bankLabel(result.bank)} · {result.difficulty}
              </p>
              <p className="text-xs text-slate-500">{new Date(result.date).toLocaleString()}</p>
            </div>
            <span className="font-semibold text-slate-900 tabular-nums">
              {result.correct}/{result.total} ({result.percentage}%)
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function MockInterview() {
  const [stage, setStage] = useState('setup') // 'setup' | 'running' | 'finished'
  const [settings, setSettings] = useState({ bank: 'java', difficulty: 'Beginner', count: 10 })
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState([]) // true = correct, false = incorrect

  const start = (count = settings.count) => {
    setQuestions(pickRandom(getInterviewQuestions(settings.bank, settings.difficulty), count))
    setCurrent(0)
    setRevealed(false)
    setAnswers([])
    setStage('running')
  }

  const grade = (isCorrect) => {
    const next = [...answers]
    next[current] = isCorrect
    setAnswers(next)
  }

  const goNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
      setRevealed(false)
      return
    }
    const correct = answers.filter((answer) => answer === true).length
    saveMockInterviewResult({
      date: new Date().toISOString(),
      bank: settings.bank,
      difficulty: settings.difficulty,
      total: questions.length,
      correct,
      incorrect: questions.length - correct,
      percentage: Math.round((correct / questions.length) * 100),
    })
    setStage('finished')
  }

  if (stage === 'setup') {
    return (
      <div className="space-y-6">
        <Setup settings={settings} onChange={setSettings} onStart={start} />
        <History />
      </div>
    )
  }

  if (stage === 'finished') {
    return (
      <Results
        questions={questions}
        answers={answers}
        settings={settings}
        onRestart={() => start(questions.length)}
        onChangeSettings={() => setStage('setup')}
      />
    )
  }

  const question = questions[current]
  const graded = answers[current] !== undefined
  const isLast = current === questions.length - 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <ProgressBar value={(current / questions.length) * 100} showValue={false} className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setStage('setup')}>
          Quit
        </Button>
      </div>

      <QuestionCard question={question} number={current + 1} total={questions.length} />

      {!revealed ? (
        <div className="flex justify-center">
          <Button size="lg" icon={Eye} onClick={() => setRevealed(true)}>
            Show Answer
          </Button>
        </div>
      ) : (
        <>
          <AnswerSection question={question} />
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">Did you get it right?</p>
              <p className="text-sm text-slate-500">Be honest — this is only for you.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={answers[current] === true ? 'success' : 'secondary'}
                icon={ThumbsUp}
                onClick={() => grade(true)}
                aria-pressed={answers[current] === true}
              >
                I got it right
              </Button>
              <Button
                variant={answers[current] === false ? 'danger' : 'secondary'}
                icon={ThumbsDown}
                onClick={() => grade(false)}
                aria-pressed={answers[current] === false}
              >
                I got it wrong
              </Button>
              <Button disabled={!graded} onClick={goNext}>
                {isLast ? 'See Results' : 'Next Question'}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export default MockInterview
