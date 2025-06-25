import type { AppRouter } from '@/entrypoints/background'

import { Toaster } from '@/components/ui/sonner.tsx'
import '@/entrypoints/style.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact } from '@trpc/react-query'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router'
import { chromeLink } from 'trpc-chrome/link'

import App from './App.tsx'
import Auth from './auth/Auth.tsx'
import { Providers } from './auth/Providers.tsx'
import RootLayout from './layout.tsx'
import { ThemeProvider } from './theme-provider.tsx'

const port = browser.runtime.connect() as chrome.runtime.Port

const trpcReact = createTRPCReact<AppRouter>()

function Root() {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [chromeLink({ port })],
    }),
  )

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <HashRouter>
            <Routes>
              <Route element={<Providers />}>
                <Route element={<RootLayout />}>
                  <Route element={<App />} path="/" />
                  <Route element={<Auth />} path=":pathname" />
                </Route>
              </Route>
            </Routes>
          </HashRouter>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </trpcReact.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
