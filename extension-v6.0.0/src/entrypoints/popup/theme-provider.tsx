import type { ComponentProps } from 'react'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted)
    return

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
