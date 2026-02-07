"use client"

import { motion } from "framer-motion"
import { Github, Twitter, MessageCircle, Book, Rocket } from "lucide-react"
import Link from "next/link"

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
  { icon: MessageCircle, label: "Discord", href: "#" },
  { icon: Book, label: "Docs", href: "#" },
]

const footerLinks = {
  Product: ["Launch Token", "Explore Tokens", "How It Works", "Roadmap"],
  Developers: ["Documentation", "GitHub", "API Reference", "Smart Contracts"],
  Resources: ["Blog", "FAQ", "Support", "Brand Kit"],
  Legal: ["Terms of Service", "Privacy Policy", "Cookie Policy"],
}

export function Footer() {
  return (
    <footer className="bg-black border-t border-[#424242] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold font-mono text-white">
                MEME<span className="text-primary">FI</span>
              </span>
            </div>
            <p className="text-white/60 mb-6 max-w-sm font-mono text-sm">
              A Sui-native DeFi primitive for fair memecoin launches with privacy-aware early trading sessions.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 border border-[#424242] bg-[#121212]/30 flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-all group"
                  aria-label={social.label}
                  style={{
                    clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 calc(100% - 8px), 0 8px)',
                  }}
                >
                  <social.icon className="w-5 h-5 text-white/60 group-hover:text-primary transition-colors" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-bold font-mono uppercase text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-white/60 hover:text-primary transition-colors text-sm font-mono"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#424242] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm font-mono">
            © 2026 MemeFi. Built for <span className="text-primary">HackMoney 2026</span>.
          </p>
          <div className="flex items-center gap-6 text-sm font-mono">
            <span className="text-white/60">Powered by</span>
            <motion.span
              className="text-primary font-bold"
              whileHover={{ scale: 1.05 }}
            >
              Sui
            </motion.span>
            <span className="text-white/40">×</span>
            <motion.span
              className="text-primary font-bold"
              whileHover={{ scale: 1.05 }}
            >
              ENS
            </motion.span>
          </div>
        </div>
      </div>
    </footer>
  )
}

