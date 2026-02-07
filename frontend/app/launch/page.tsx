import { LaunchForm } from "@/components/launch-form"
import { Footer } from "@/components/footer"

export default function LaunchPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="pt-24">
        <LaunchForm />
      </div>
      <Footer />
    </main>
  )
}
