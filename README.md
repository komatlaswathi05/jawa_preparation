# Java & Spring Boot Interview Preparation

A study platform for learning Java, Spring Boot and SQL and preparing for backend developer interviews.
It runs entirely in the browser: all study material lives in JavaScript data files and all progress is saved in `localStorage`. There is no backend.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
npm run lint
```

## Features

- **Dashboard**: overall and per-category progress, statistics, and a "Continue Learning" card that points to the first topic you haven't completed.
- **Topic pages**: every topic uses the same layout. Each page has an overview, topics to learn, important concepts with code examples, common mistakes, interview tips, interview questions and related coding questions. There is also a "Mark as Completed" button and previous/next navigation.
- **Interview questions**: questions grouped into Java, Spring Boot and SQL banks, with difficulty filters. Each question has an answer, an example and key points.
- **Coding questions**: 180 problems in 15 categories, including linked lists, trees, stacks and queues, graphs and dynamic programming, each with a Java (or SQL) solution and a complexity analysis.
- **Mock interview**: random questions by subject and difficulty. You grade yourself, get a score at the end, and past results are kept in a history.
- **Progress**: progress bars for every category, a study streak and a reset button.
- **Search**: global search across topics, concepts, interview questions and coding questions. Press `/` or `Ctrl/Cmd + K` to focus it.
- **Bookmarks**: save topics, interview questions and coding questions for later.

## Project structure

```
src/
  components/
    Common/      Button, Card, Badge, Modal, Search, Tabs, Accordion, CodeBlock, ...
    Layout/      Layout, Sidebar, Header, MobileMenu
    Dashboard/   ProgressCard, StatsCard, ContinueLearning
    Study/       TopicHeader, TopicContent, TopicProgress, CompletionButton,
                 InterviewQuestion, CodingQuestion, PreviousNextNavigation, ...
    Progress/    ProgressBar, ProgressOverview
    Interview/   MockInterview, QuestionCard, AnswerSection
  pages/         One file per route (Dashboard, Java, SQL, Topic, Progress, ...)
  data/
    topics/      One file per topic (study material + interview questions)
    coding/      Coding questions, one file per category
    javaData.js, sqlData.js, ...   Topic lists per category, in study order
    categories.js                  Category metadata + topic lookup helpers
    interviewQuestions.js          Question banks built from all topics
    codingQuestions.js             All coding questions
    navigation.js                  Sidebar structure
  hooks/         useLocalStorage, useStudyProgress, useBookmarks, useStudyActivity, useProgressStats
  utils/         storageUtils (localStorage + keys), progressUtils, searchUtils
```

## How progress is stored

All keys are defined in `src/utils/storageUtils.js`:

| Key | Contents |
| --- | --- |
| `javaSpringStudyProgress` | Completed topics, e.g. `{ "java-oop": true }` |
| `interviewQuestionProgress` | Interview questions marked as reviewed |
| `javaCodingProgress` | Coding questions marked as solved |
| `mockInterviewHistory` | Your last 20 mock interview results |
| `studyActivity` | Days you studied, e.g. `{ "2026-09-29": true }` |
| `lastStudyTopic` | The last topic you opened |
| `studyBookmarks` | Bookmarked topics and questions |

`useLocalStorage` subscribes to these values, so the sidebar, dashboard and progress bars update as soon as anything changes. This also works across browser tabs.

## Adding content

1. Create `src/data/topics/<topic-id>.js` with the same shape as the existing topics: `id`, `category`, `title`, `description`, `difficulty`, `overview`, `subtopics`, `commonMistakes`, `interviewTips` and `interviewQuestions`.
2. Import it in the matching category file, e.g. `src/data/javaData.js`.
3. Add a sidebar entry in `src/data/navigation.js`.

In text fields, a blank line (`\n\n`) starts a new paragraph and `backticks` render as inline code.
