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
    color: "#AFFF00",
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
    color: "#00D4FF",
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
    color: "#7AB800",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-[#121212] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 noise-overlay opacity-30" />
      <motion.div
        className="absolute top-1/4 left-10 w-64 h-64 rounded-full bg-[#AFFF00]/10 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            How It <span className="text-[#AFFF00]">Works</span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Three simple steps to fair, private, and transparent memecoin launches
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-24">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-12`}
            >
              {/* Icon Side */}
              <div className="flex-1 flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <div
                    className="w-32 h-32 rounded-3xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}20 0%, ${step.color}10 100%)`,
                      border: `2px solid ${step.color}40`,
                    }}
                  >
                    <step.icon className="w-16 h-16" style={{ color: step.color }} />
                  </div>
                  <div
                    className="absolute -top-4 -right-4 w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl"
                    style={{
                      background: step.color,
                      color: "#121212",
                    }}
                  >
                    {step.number}
                  </div>
                </motion.div>
              </div>

              {/* Content Side */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-3xl md:text-4xl font-black text-white mb-3">{step.title}</h3>
                  <p className="text-lg text-white/70">{step.description}</p>
                </div>

                <div className="space-y-3">
                  {step.details.map((detail, i) => (
                    <motion.div
                      key={detail}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-3 group"
                    >
                      <CheckCircle
                        className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform"
                        style={{ color: step.color }}
                      />
                      <span className="text-white/80 group-hover:text-white transition-colors">{detail}</span>
                    </motion.div>
                  ))}
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
          className="mt-24 text-center"
        >
          <div className="inline-block bg-[#AFFF00]/10 border border-[#AFFF00]/30 rounded-2xl px-8 py-6">
            <p className="text-white/90 text-lg mb-4">
              <span className="text-[#AFFF00] font-bold">Built on Sui</span> using Move's object model
            </p>
            <p className="text-white/70 text-sm">
              This is impossible to implement cleanly on Solana or Ethereum
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
