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
  Product: ["Launch Token", "Explore Sessions", "How It Works", "Roadmap"],
  Developers: ["Documentation", "GitHub", "API Reference", "Smart Contracts"],
  Resources: ["Blog", "FAQ", "Support", "Brand Kit"],
  Legal: ["Terms of Service", "Privacy Policy", "Cookie Policy"],
}

export function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-8 h-8 text-[#AFFF00]" />
              <span className="text-2xl font-black text-white">
                Meme<span className="text-[#AFFF00]">Fi</span>
              </span>
            </div>
            <p className="text-white/70 mb-6 max-w-sm">
              A Sui-native DeFi primitive for fair memecoin launches with privacy-aware early trading sessions.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#AFFF00]/20 hover:border-[#AFFF00]/50 transition-all group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-white/70 group-hover:text-[#AFFF00] transition-colors" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-bold mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-white/70 hover:text-[#AFFF00] transition-colors text-sm"
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
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            © 2026 MemeFi. Built for <span className="text-[#AFFF00]">HackMoney 2026</span>.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-white/70">Powered by</span>
            <motion.span
              className="text-[#AFFF00] font-bold"
              whileHover={{ scale: 1.05 }}
            >
              Sui
            </motion.span>
            <span className="text-white/50">×</span>
            <motion.span
              className="text-[#AFFF00] font-bold"
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
