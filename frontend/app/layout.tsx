import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LenisProvider } from "@/components/lenis-provider"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import ClickSpark from "@/components/click-spark"
import "./globals.css"

const _inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const _jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "MemeFi | Fair Launch DeFi Protocol on Sui",
  description: "Sui-native memecoin launch and trading protocol with protocol-enforced fair launches and privacy-aware early trading sessions.",
  keywords: ["DeFi", "Sui", "memecoin", "fair launch", "crypto", "blockchain"],
}

export const viewport: Viewport = {
  themeColor: "#AFFF00",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          <ClickSpark
            sparkColor="#AFFF00"
            sparkSize={12}
            sparkRadius={20}
            sparkCount={8}
            duration={400}
            easing="ease-out"
          >
            <LenisProvider>{children}</LenisProvider>
          </ClickSpark>
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
