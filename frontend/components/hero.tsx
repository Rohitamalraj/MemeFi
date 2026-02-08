"use client"

import Link from "next/link"
import { GL } from "./gl"
import { Pill } from "./pill"
import { Button } from "./ui/button"
import { useState } from "react"

export function Hero() {
  const [hovering, setHovering] = useState(false)
  return (
    <div className="flex flex-col h-svh justify-between">
      <GL hovering={hovering} />

      <div className="pb-16 mt-auto text-center relative">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient">
          Fair Launch <br />
          <i className="font-light">DeFi Primitive</i>
        </h1>
        <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[440px] mx-auto">
          A Sui-native memecoin launch and trading protocol that enforces fair launches at the protocol level and protects users with privacy-aware early trading sessions
        </p>

        <Link className="contents max-sm:hidden" href="/launch">
          <Button
            className="mt-14"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            [Launch Token]
          </Button>
        </Link>
        <Link className="contents sm:hidden" href="/launch">
          <Button
            size="sm"
            className="mt-14"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            [Launch Token]
          </Button>
        </Link>
      </div>
    </div>
  )
}


