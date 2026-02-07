"use client"

import { motion } from "framer-motion"
import { Rocket, Lock, TrendingUp, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: Rocket,
    number: "01",
    title: "Fair Launch",
    description: "Launch rules embedded in Move objects",
    details: [
      "Max buy per wallet enforced",
      "Time-based phases locked in",
      "No creator advantage possible",
      "Protocol-level enforcement",
    ],
  },
  {
    icon: Lock,
    number: "02",
    title: "Private Trading Session",
    description: "Early trading happens safely",
    details: [
      "Temporary ENS identities",
      "Hidden wallet balances",
      "No MEV targeting",
      "Fair price discovery",
    ],
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "Public Settlement",
    description: "Transparent after protection",
    details: [
      "Sessions close automatically",
      "Final balances settle on-chain",
      "Full transparency returns",
      "Normal DeFi resumes",
    ],
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-black relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-sentient)' }}>
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto font-mono">
            Three simple steps to fair, private, and transparent memecoin launches
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="border border-[#424242] bg-[#121212]/30 p-8 md:p-10"
              style={{
                clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 calc(100% - 16px), 0 16px)',
              }}
            >
              <div className="flex flex-col md:flex-row items-start gap-8">
                {/* Number & Icon */}
                <div className="flex items-center gap-6">
                  <div className="text-6xl font-bold text-primary font-mono opacity-20">
                    {step.number}
                  </div>
                  <div className="p-4 border border-primary/30 bg-primary/5">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2 font-mono uppercase">{step.title}</h3>
                    <p className="text-base text-white/60 font-mono">{step.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {step.details.map((detail, i) => (
                      <motion.div
                        key={detail}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-3 group"
                      >
                        <CheckCircle className="w-5 h-5 flex-shrink-0 text-primary" />
                        <span className="text-sm text-white/70 font-mono">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <div className="inline-block border border-primary/30 bg-primary/5 px-10 py-8"
            style={{
              clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 calc(100% - 12px), 0 12px)',
            }}
          >
            <p className="text-white text-lg mb-2 font-mono">
              <span className="text-primary font-bold">Built on Sui</span> using Move's object model
            </p>
            <p className="text-white/60 text-sm font-mono">
              This is impossible to implement cleanly on Solana or Ethereum
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

