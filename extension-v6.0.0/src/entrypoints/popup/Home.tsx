import { authClient } from '@/auth/client'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, Facebook, Linkedin, Loader2, Twitter } from 'lucide-react'
import { animate } from 'motion'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

export default function Home() {
  const spanRef = useRef<HTMLSpanElement>(null)
  const rotatingTextRef = useRef<HTMLSpanElement>(null)
  const shinyTextRef = useRef<HTMLSpanElement>(null)
  const [platformIndex, setPlatformIndex] = useState(0)
  const platforms = ['Facebook', 'Twitter', 'LinkedIn']
  const { error, isPending } = authClient.useSession()

  useEffect(() => {
    if (!spanRef.current)
      return

    // Create the aurora gradient animation effect
    animate(
      spanRef.current.style,
      {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      },
      {
        duration: 15,
        ease: 'easeInOut',
        repeat: Infinity,
      },
    )
  }, [])

  // Word rotation animation effect
  useEffect(() => {
    if (!rotatingTextRef.current)
      return

    const intervalId = setInterval(() => {
      // Animate text out
      animate(
        rotatingTextRef.current!,
        { opacity: 0, y: -20 },
        {
          duration: 0.3,
          ease: 'easeIn',
          onComplete: () => {
            // Change text and animate back in
            setPlatformIndex(prevIndex => (prevIndex + 1) % platforms.length)
            animate(
              rotatingTextRef.current!,
              { opacity: 1, y: 0 },
              { duration: 0.3, ease: 'easeOut' },
            )
          },
        },
      )
    }, 2000)

    // Initial animation setup
    rotatingTextRef.current.style.opacity = '1'
    rotatingTextRef.current.style.transform = 'translateY(0)'

    return () => clearInterval(intervalId)
  }, [])

  // Shiny text animation
  useEffect(() => {
    if (!shinyTextRef.current)
      return

    animate(
      shinyTextRef.current.style,
      {
        backgroundPosition: ['200% center', '-200% center'],
      },
      {
        duration: 6, // Increased from 3 to 6 seconds for smoother effect
        ease: 'easeInOut',
        repeat: Infinity,
      },
    )
  }, [])

  // Only proceed with redirection after we know the session status
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="flex flex-col items-center gap-4">
          <span>
            {error.message && `Error: ${error.message}.`}
            Uh oh! Something went wrong.
          </span>
          <Link to="/login">
            <Button size="sm" variant="outline">Try logging in</Button>
          </Link>
        </h1>
      </div>
    )
  }

  return (
    <>
      <header className="space-y-4">
        <div className="flex items-center justify-center">
          <div
            className="group rounded-full border border-black/5 bg-neutral-100 transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <div className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:duration-300">
              <span
                className="bg-[linear-gradient(110deg,#000,45%,#e5e5e5,55%,#000)] dark:bg-[linear-gradient(110deg,#fff,45%,#a5a5a5,55%,#fff)] bg-[length:250%_100%] text-transparent bg-clip-text font-medium"
                ref={shinyTextRef}
              >
                ✨ No credit card required
              </span>
              <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl text-center">
          Grow
          {' '}
          <span
            className="italic bg-gradient-to-r from-blue-500 via-purple-600 to-green-400 text-transparent bg-clip-text bg-[length:200%_auto]"
            ref={spanRef}
          >
            fast
          </span>
          {' '}
          on
          {' '}
          <span
            className="inline-block"
            ref={rotatingTextRef}
          >
            {platforms[platformIndex]}
          </span>
        </h1>
        <p className="text-sm text-center text-muted-foreground">
          Human like post reply to grow your audience and engagement on social media.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="sm" variant="default">
            <Link target="_blank" to={new URL('/#pricing', import.meta.env.WXT_SITE_URL).href}>
              Get started
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link target="_blank" to={new URL('/#content', import.meta.env.WXT_SITE_URL).href}>
              Learn more
            </Link>
          </Button>
        </div>
        <div className="flex justify-center gap-4">
          <Twitter className="size-5" />
          <Linkedin className="size-5" />
          <Facebook className="size-5" />
        </div>

        <p className="text-sm text-center mt-2 text-muted-foreground">
          Reach out to our support to learn how our extension helps you engage with your audience.
        </p>

        <div className="flex justify-center gap-4">
          <Button asChild className="w-full" size="sm" variant="outline">
            <Link target="_blank" to={new URL('/contact', import.meta.env.WXT_SITE_URL).href}>Contact Support</Link>
          </Button>
        </div>
      </header>
    </>
  )
}
