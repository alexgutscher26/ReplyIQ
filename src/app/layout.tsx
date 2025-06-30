import { ThemeProvider } from "@/app/_components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { GeistSans } from "geist/font/sans";
import { type Metadata, type Viewport } from "next";
import { Providers } from "./(frontend)/auth/providers";

export const metadata: Metadata = {
  title: {
    template: "%s | ReplyIQ",
    default: "ReplyIQ - AI-Powered Social Media Assistant",
  },
  description: "ReplyIQ is an intelligent SaaS platform that empowers users to create engaging, contextually-appropriate responses for social media platforms using advanced AI technology. Perfect for social media managers, content creators, and businesses.",
  keywords: [
    "AI social media",
    "social media assistant", 
    "AI reply generator",
    "social media automation",
    "content creation",
    "brand voice",
    "social media management",
    "AI content generator",
    "Twitter automation",
    "LinkedIn automation",
    "Facebook automation",
    "social media engagement"
  ],
  authors: [{ name: "ReplyIQ Team" }],
  creator: "ReplyIQ",
  publisher: "ReplyIQ",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://replyiq.ai",
    siteName: "ReplyIQ",
    title: "ReplyIQ - AI-Powered Social Media Assistant",
    description: "Create engaging, contextually-appropriate social media responses with advanced AI technology. Streamline your social media engagement across multiple platforms.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReplyIQ - AI-Powered Social Media Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplyIQ - AI-Powered Social Media Assistant",
    description: "Create engaging, contextually-appropriate social media responses with advanced AI technology.",
    images: ["/twitter-image.png"],
    creator: "@replyiq",
    site: "@replyiq",
  },
  category: "SaaS",
  classification: "Business Software",
  other: {
    "theme-color": "#3b82f6",
    "color-scheme": "light dark",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "ReplyIQ",
    "application-name": "ReplyIQ",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${GeistSans.variable}`}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Additional SEO meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "ReplyIQ",
              "description": "AI-powered social media assistant for creating engaging responses",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "category": "SaaS"
              },
              "provider": {
                "@type": "Organization",
                "name": "ReplyIQ"
              }
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <TRPCReactProvider>
          <Providers>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster 
                position="top-right"
                expand={true}
                richColors={true}
                closeButton={true}
                toastOptions={{
                  duration: 4000,
                  className: "font-sans",
                }}
              />
            </ThemeProvider>
          </Providers>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
