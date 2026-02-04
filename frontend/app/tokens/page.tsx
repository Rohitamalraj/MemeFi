import { Navigation } from "@/components/navigation"
import { TokensPage } from "@/components/tokens-page"
import { Footer } from "@/components/footer"

export default function Tokens() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <TokensPage />
      <Footer />
    </main>
  )
}
