"use client"

import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { useRef } from "react"
import { Shield, Zap, Lock, TrendingUp, Rocket, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 }

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

const features = [
  {
    icon: Shield,
    title: "Protocol-Enforced Fairness",
    description: "Launch rules embedded in Move objects. Cheating is literally impossible.",
  },
  {
    icon: Eye,
    title: "Privacy-Aware Trading",
    description: "Early sessions are private. No wallet targeting or MEV exploitation.",
  },
  {
    icon: TrendingUp,
    title: "Public Settlement",
    description: "Progressive transparency: private discovery → public trading.",
  },
]

export function HeroSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const rawY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const y = useSpring(rawY, springConfig)

  const rawTextX1 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const textX1 = useSpring(rawTextX1, springConfig)

  const rawTextX2 = useTransform(scrollYProgress, [0, 1], [0, 100])
  const textX2 = useSpring(rawTextX2, springConfig)

  const rawScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const scale = useSpring(rawScale, springConfig)

  const rawOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const opacity = useSpring(rawOpacity, springConfig)

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white noise-overlay"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#AFFF00]/5 to-white" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 left-10 w-24 h-24 rounded-full bg-[#AFFF00]/20 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-40 right-20 w-32 h-32 rounded-full bg-[#AFFF00]/10 blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-blue-500/10 blur-3xl"
        animate={{
          x: [0, 20, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center space-y-8">
          {/* Badge */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 bg-[#121212] text-white px-4 py-2 rounded-full text-xs font-mono tracking-wider"
          >
            <motion.span
              className="w-2 h-2 bg-[#AFFF00] rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
            NOT A PUMP.FUN CLONE
          </motion.div>

          {/* Main Heading */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={1}
            className="space-y-4"
          >
            <div className="overflow-hidden">
              <motion.h1
                style={{ x: textX1 }}
                className="text-6xl md:text-8xl font-black tracking-tighter leading-none"
              >
                <span className="text-[#121212]">Fair Launch</span>
              </motion.h1>
              <motion.h1
                style={{ x: textX2 }}
                className="text-6xl md:text-8xl font-black tracking-tighter leading-none"
              >
                <span className="text-[#AFFF00] inline-block">
                  DeFi Primitive
                </span>
              </motion.h1>
            </div>
            <p className="text-xl md:text-2xl text-[#121212]/70 max-w-3xl mx-auto font-medium">
              Sui-native protocol with <span className="text-[#AFFF00] font-bold">rule-enforced fairness</span> and{" "}
              <span className="text-[#AFFF00] font-bold">privacy-aware</span> early trading sessions
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={2}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href="/launch">
              <motion.button
                className="bg-[#AFFF00] text-[#121212] px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 group relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                  whileHover={{ x: "200%" }}
                  transition={{ duration: 0.6 }}
                />
                <Rocket className="w-5 h-5 relative z-10 group-hover:animate-bounce" />
                <span className="relative z-10">Launch Token</span>
              </motion.button>
            </Link>
            <Link href="/sessions">
              <motion.button
                className="border-2 border-[#121212] text-[#121212] px-8 py-3 rounded-full font-bold text-lg relative overflow-hidden"
                whileHover={{ scale: 1.02, backgroundColor: "#121212", color: "#fff" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Zap className="w-5 h-5 inline-block mr-2" />
                Explore Sessions
              </motion.button>
            </Link>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={3}
            className="grid md:grid-cols-3 gap-6 pt-16 max-w-5xl mx-auto"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                className="bg-white/50 backdrop-blur-sm border-2 border-[#121212]/10 rounded-2xl p-6 hover:border-[#AFFF00] transition-all hover:shadow-lg hover:shadow-[#AFFF00]/20 group"
              >
                <feature.icon className="w-10 h-10 text-[#AFFF00] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-[#121212] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#121212]/70">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={4}
            className="flex flex-wrap items-center justify-center gap-12 pt-12 border-t border-[#121212]/10 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="text-4xl font-black text-[#121212]">100%</div>
              <div className="text-sm text-[#121212]/70 font-medium mt-1">Fair Launches</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-[#AFFF00]">Sui</div>
              <div className="text-sm text-[#121212]/70 font-medium mt-1">Native Protocol</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-[#121212]">0%</div>
              <div className="text-sm text-[#121212]/70 font-medium mt-1">Front-Running</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        <div className="w-6 h-10 border-2 border-[#121212]/30 rounded-full flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 bg-[#AFFF00] rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>
      </motion.div>
    </section>
  )
}
