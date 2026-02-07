"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useLenis } from "lenis/react"
import { Menu, X, Rocket, Shield, Zap } from "lucide-react"
import { WalletButton } from "@/components/wallet-button"

const linkVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const lenis = useLenis()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id)
    if (element && lenis) {
      lenis.scrollTo(element, { offset: -100 })
    }
    setMobileMenuOpen(false)
  }

  const navLinks = [
    { label: "Home", href: "/", isHash: false },
    { label: "Tokens", href: "/tokens", isHash: false },
    { label: "Launch", href: "/launch", isHash: false },
    { label: "Portfolio", href: "/portfolio", isHash: false },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#121212]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Rocket className={`w-6 h-6 ${scrolled ? "text-[#AFFF00]" : "text-[#121212]"}`} />
            <span className="text-2xl font-black tracking-tighter">
              <span className={scrolled ? "text-white" : "text-[#121212]"}>Meme</span>
              <motion.span
                className="text-[#AFFF00]"
                animate={{
                  textShadow: scrolled
                    ? ["0 0 10px rgba(175,255,0,0.5)", "0 0 20px rgba(175,255,0,0.8)", "0 0 10px rgba(175,255,0,0.5)"]
                    : "none",
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                Fi
              </motion.span>
            </span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link, i) => (
            link.isHash ? (
              <motion.button
                key={link.href}
                variants={linkVariants}
                initial="hidden"
                animate="visible"
                custom={i}
                onClick={() => scrollToSection(link.href)}
                className={`text-sm font-medium transition-colors hover:text-[#AFFF00] ${
                  scrolled ? "text-white/80" : "text-[#121212]/80"
                }`}
              >
                {link.label}
              </motion.button>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#AFFF00] ${
                  scrolled ? "text-white/80" : "text-[#121212]/80"
                }`}
              >
                {link.label}
              </Link>
            )
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Sui Wallet Button - Shows ENS name if mapped */}
            <WalletButton />
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className={scrolled ? "text-white" : "text-[#121212]"} />
          ) : (
            <Menu className={scrolled ? "text-white" : "text-[#121212]"} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden bg-[#121212] border-t border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-4">
              {navLinks.map((link, i) => (
                link.isHash ? (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => scrollToSection(link.href)}
                    className="block w-full text-left text-white/80 hover:text-[#AFFF00] py-2 text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </motion.button>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block w-full text-left text-white/80 hover:text-[#AFFF00] py-2 text-sm font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              ))}
              
              {/* Mobile Wallet Button */}
              <div className="pt-2">
                {/* Sui Wallet - Shows ENS name if mapped */}
                <WalletButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
