import { authClient } from '@/auth/client'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { NavLink, Outlet, useNavigate } from 'react-router'

export function Providers() {
  const navigate = useNavigate()

  return (
    <AuthUIProvider
      authClient={authClient}
      basePath="/"
      forgotPassword={false}
      LinkComponent={({ href, ...props }) => (
        <NavLink {...props} to={href} />
      )}
      nameRequired={true}
      navigate={navigate}
    >
      <Outlet />
    </AuthUIProvider>
  )
}
