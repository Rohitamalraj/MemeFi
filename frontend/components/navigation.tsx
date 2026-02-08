"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useLenis } from "lenis/react"
import { Menu, X, Rocket } from "lucide-react"
import { WalletButton } from "@/components/wallet-button"

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
}

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const lenis = useLenis()

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id)
    if (element && lenis) {
      lenis.scrollTo(element as unknown as HTMLElement, { offset: -100 })
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-sm border-b border-[#424242]">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Rocket className="w-6 h-6 text-primary" />
            <span className="text-2xl font-bold font-mono tracking-tight">
              <span className="text-white">MEME</span>
              <span className="text-primary">FI</span>
            </span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.isHash ? (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-mono uppercase text-white/60 hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-mono uppercase text-white/60 hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </Link>
            )
          ))}
          <WalletButton />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="text-white" />
          ) : (
            <Menu className="text-white" />
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
            className="md:hidden bg-black border-t border-[#424242] overflow-hidden"
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
                    className="block w-full text-left text-white/60 hover:text-primary py-2 text-sm font-mono uppercase transition-colors"
                  >
                    {link.label}
                  </motion.button>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block w-full text-left text-white/60 hover:text-primary py-2 text-sm font-mono uppercase transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              ))}
              <div className="pt-2">
                <WalletButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
