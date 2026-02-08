import type React from "react"
import type { Metadata, Viewport } from "next"
import { JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers"
import { Web3Provider } from "@/components/web3-provider"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/header"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "MemeFi | Fair Launch DeFi Protocol on Sui",
  description: "Sui-native memecoin launch and trading protocol with protocol-enforced fair launches and privacy-aware early trading sessions.",
  keywords: ["DeFi", "Sui", "memecoin", "fair launch", "crypto", "blockchain"],
}

export const viewport: Viewport = {
  themeColor: "#FFC700",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Web3Provider>
          <Providers>
            <Header />
            {children}
            <Toaster />
          </Providers>
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}
