import { Navigation } from "@/components/navigation"
import { LaunchForm } from "@/components/launch-form"
import { Footer } from "@/components/footer"

export default function LaunchPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-24">
        <LaunchForm />
      </div>
      <Footer />
    </main>
  )
}
