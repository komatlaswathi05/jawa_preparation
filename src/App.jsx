import { Route, Routes } from 'react-router'
import Layout from './components/Layout/Layout.jsx'
import Bookmarks from './pages/Bookmarks.jsx'
import CodingQuestions from './pages/CodingQuestions.jsx'
import Dashboard from './pages/Dashboard.jsx'
import InterviewQuestions from './pages/InterviewQuestions.jsx'
import Java from './pages/Java.jsx'
import JPA from './pages/JPA.jsx'
import Microservices from './pages/Microservices.jsx'
import MockInterview from './pages/MockInterview.jsx'
import NotFound from './pages/NotFound.jsx'
import Progress from './pages/Progress.jsx'
import Security from './pages/Security.jsx'
import Spring from './pages/Spring.jsx'
import SpringBoot from './pages/SpringBoot.jsx'
import SQL from './pages/SQL.jsx'
import Testing from './pages/Testing.jsx'
import Topic from './pages/Topic.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />

        {/* Category pages */}
        <Route path="java" element={<Java />} />
        <Route path="sql" element={<SQL />} />
        <Route path="spring" element={<Spring />} />
        <Route path="spring-boot" element={<SpringBoot />} />
        <Route path="jpa" element={<JPA />} />
        <Route path="security" element={<Security />} />
        <Route path="testing" element={<Testing />} />
        <Route path="microservices" element={<Microservices />} />

        {/* Every topic uses the same layout */}
        <Route path="topics/:topicId" element={<Topic />} />

        {/* Interview preparation */}
        <Route path="interview-questions" element={<InterviewQuestions />} />
        <Route path="coding-questions" element={<CodingQuestions />} />
        <Route path="mock-interview" element={<MockInterview />} />

        <Route path="progress" element={<Progress />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
