import { Navigation } from "@/components/navigation"
import { DashboardPage } from "@/components/dashboard-page"
import { Footer } from "@/components/footer"

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <DashboardPage />
      <Footer />
    </main>
  )
}
