import { Navigation } from "@/components/navigation"
import { SessionsPage } from "@/components/sessions-page"
import { Footer } from "@/components/footer"

export default function Sessions() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <SessionsPage />
      <Footer />
    </main>
  )
}
