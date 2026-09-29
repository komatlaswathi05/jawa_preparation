import { Search } from 'lucide-react'
import Button from '../components/Common/Button.jsx'
import EmptyState from '../components/Common/EmptyState.jsx'

function NotFound() {
  return (
    <EmptyState
      icon={Search}
      title="Page not found"
      description="The page you are looking for does not exist. Try the search bar or go back to the dashboard."
      action={<Button to="/">Go to Dashboard</Button>}
    />
  )
}

export default NotFound
