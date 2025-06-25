import { AuthCard } from '@daveyplate/better-auth-ui'
import { useParams } from 'react-router'

export default function Auth() {
  const { pathname } = useParams()

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <AuthCard pathname={pathname} />
    </div>
  )
}
