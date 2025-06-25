import type { AppRouter } from '@/entrypoints/background'

import { AuthLoading, SignedIn, SignedOut } from '@daveyplate/better-auth-ui'
import { createTRPCReact } from '@trpc/react-query'

import { Dashboard } from './dashboard/Dashboard'
import { DashboardSkeleton } from './dashboard/DashboardSkeleton'
import Home from './Home'

const trpcReact = createTRPCReact<AppRouter>()

function App() {
  const { data: hello } = trpcReact.greeting.useQuery({ name: 'tRPC' })
  trpcReact.onGreeting.useSubscription(undefined, {
    onData: (hello) => {
      // eslint-disable-next-line no-console
      console.log(hello)
    },
  })

  if (!hello) {
    return null
  }

  return (
    <div data-testid="greeting">
      <SignedOut>
        <Home />
      </SignedOut>

      <AuthLoading>
        <DashboardSkeleton />
      </AuthLoading>

      <SignedIn>
        <Dashboard />
      </SignedIn>
    </div>
  )
}

export default App
