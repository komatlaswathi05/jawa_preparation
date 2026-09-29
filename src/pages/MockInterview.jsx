import { Timer } from 'lucide-react'
import Breadcrumbs from '../components/Common/Breadcrumbs.jsx'
import PageHeader from '../components/Common/PageHeader.jsx'
import MockInterviewSession from '../components/Interview/MockInterview.jsx'

function MockInterview() {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Mock Interview' }]} />
      <PageHeader
        icon={Timer}
        title="Mock Interview"
        description="Random questions from the question bank. Answer, reveal the model answer, and grade yourself."
      />
      <MockInterviewSession />
    </div>
  )
}

export default MockInterview
