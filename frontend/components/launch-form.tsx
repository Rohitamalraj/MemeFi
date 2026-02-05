"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Rocket, Info, Shield, Clock, Users, TrendingUp, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTokenLaunch } from "@/lib/use-contracts"
import { useWalletConnection } from "@/lib/use-wallet"
import { getExplorerUrl } from "@/lib/contract-config"

interface LaunchFormData {
  tokenName: string
  tokenSymbol: string
  totalSupply: string
  description: string
  imageUrl: string
  maxBuyPerWallet: string
  earlyPhaseDuration: string
  sessionDuration: string
  restrictTransfers: boolean
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

export function LaunchForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const { launchToken, isLaunching, launchResult } = useTokenLaunch()
  const { isConnected } = useWalletConnection()
  
  const [formData, setFormData] = useState<LaunchFormData>({
    tokenName: "",
    tokenSymbol: "",
    totalSupply: "",
    description: "",
    imageUrl: "",
    maxBuyPerWallet: "",
    earlyPhaseDuration: "24",
    sessionDuration: "6",
    restrictTransfers: true,
  })

  const handleInputChange = (field: keyof LaunchFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLaunch = async () => {
    console.log('🚀 Launch button clicked');
    console.log('Form data:', formData);
    
    if (!isConnected) {
      console.error('❌ Wallet not connected');
      alert('Please connect your wallet first')
      return
    }

    console.log('✅ Wallet connected, preparing transaction...');

    const totalSupply = Number.parseInt(formData.totalSupply)
    const maxBuyPerWallet = Number.parseInt(formData.maxBuyPerWallet)
    // Use session duration as the base - all phases will be this length
    // Use parseFloat to handle decimal hours like 0.05
    const phaseDurationMs = Math.floor(parseFloat(formData.sessionDuration) * 60 * 60 * 1000) // Convert hours to milliseconds

    const launchParams = {
      name: formData.tokenName,
      symbol: formData.tokenSymbol,
      totalSupply,
      maxBuyPerWallet,
      phaseDurationMs,
      transfersLocked: formData.restrictTransfers,
    };

    console.log('📋 Launch parameters:', launchParams);

    const result = await launchToken(launchParams);
    
    console.log('🎯 Launch result:', result);
  }

  const steps = [
    { number: 1, title: "Token Info", icon: Rocket },
    { number: 2, title: "Fair Launch Rules", icon: Shield },
    { number: 3, title: "Review & Launch", icon: CheckCircle },
  ]

  const isStep1Valid = formData.tokenName && formData.tokenSymbol && formData.totalSupply
  const isStep2Valid = formData.maxBuyPerWallet && formData.sessionDuration

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Success State */}
      {launchResult ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 py-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-24 h-24 mx-auto bg-[#AFFF00] rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-[#121212]" />
          </motion.div>
          <div>
            <h2 className="text-4xl font-black text-[#121212] mb-4">Launch Successful! 🚀</h2>
            <p className="text-xl text-[#121212]/70 mb-2">
              <span className="font-bold text-[#AFFF00]">{formData.tokenSymbol}</span> is now live on Sui
            </p>
            <p className="text-sm text-[#121212]/50 font-mono">
              Transaction: {launchResult.digest?.slice(0, 8)}...{launchResult.digest?.slice(-6)}
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            {launchResult.explorerUrl && (
              <a href={launchResult.explorerUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold rounded-full px-8">
                  View on Explorer
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            )}
            <Button variant="outline" className="border-2 border-[#121212] rounded-full px-8" onClick={() => {
              window.location.reload()
            }}>
              Launch Another
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-black text-[#121212] mb-4">
              Launch Your <span className="text-[#AFFF00]">Memecoin</span>
            </h1>
            <p className="text-xl text-[#121212]/70">
              Create a fair launch with protocol-enforced rules
            </p>
          </motion.div>

          {/* Step Indicator */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={0}
            className="flex justify-center items-center gap-4 mb-12"
          >
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                      currentStep >= step.number
                        ? "bg-[#AFFF00] border-[#AFFF00] text-[#121212]"
                        : "bg-white border-[#121212]/20 text-[#121212]/40"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`hidden md:block font-medium ${
                      currentStep >= step.number ? "text-[#121212]" : "text-[#121212]/40"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 md:w-24 h-0.5 mx-2 ${
                      currentStep > step.number ? "bg-[#AFFF00]" : "bg-[#121212]/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </motion.div>

          {/* Form Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="border-2">
                <CardContent className="pt-6">
                  {/* Step 1: Token Info */}
                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-bold text-[#121212] mb-2">
                          Token Name *
                        </label>
                        <input
                          type="text"
                          value={formData.tokenName}
                          onChange={(e) => handleInputChange("tokenName", e.target.value)}
                          placeholder="e.g., Pepe Moon"
                          className="w-full px-4 py-3 border-2 border-[#121212]/20 rounded-xl focus:border-[#AFFF00] focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[#121212] mb-2">
                            Token Symbol *
                          </label>
                          <input
                            type="text"
                            value={formData.tokenSymbol}
                            onChange={(e) => handleInputChange("tokenSymbol", e.target.value.toUpperCase())}
                            placeholder="e.g., PEPE"
                            className="w-full px-4 py-3 border-2 border-[#121212]/20 rounded-xl focus:border-[#AFFF00] focus:outline-none transition-colors uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#121212] mb-2">
                            Total Supply *
                          </label>
                          <input
                            type="text"
                            value={formData.totalSupply}
                            onChange={(e) => handleInputChange("totalSupply", e.target.value)}
                            placeholder="e.g., 1000000000"
                            className="w-full px-4 py-3 border-2 border-[#121212]/20 rounded-xl focus:border-[#AFFF00] focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#121212] mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          placeholder="Tell people about your memecoin..."
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-[#121212]/20 rounded-xl focus:border-[#AFFF00] focus:outline-none transition-colors resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#121212] mb-2">
                          Image URL
                        </label>
                        <input
                          type="text"
                          value={formData.imageUrl}
                          onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                          placeholder="https://..."
                          className="w-full px-4 py-3 border-2 border-[#121212]/20 rounded-xl focus:border-[#AFFF00] focus:outline-none transition-colors"
                        />
                      </div>

                      <Button
                        onClick={() => setCurrentStep(2)}
                        disabled={!isStep1Valid}
                        className="w-full bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold py-6 rounded-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue to Fair Launch Rules
                      </Button>
                    </motion.div>
                  )}

                  {/* Step 2: Fair Launch Rules */}
                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="bg-[#AFFF00]/10 border-2 border-[#AFFF00]/30 rounded-xl p-4 flex gap-3">
                        <Shield className="w-6 h-6 text-[#AFFF00] flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-bold text-[#121212] mb-1">Protocol-Enforced Fairness</p>
                          <p className="text-sm text-[#121212]/70">
                            These rules are embedded in the token object and cannot be changed after launch
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#121212] mb-2">
                          Max Buy Per Wallet (Early Phase) *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.maxBuyPerWallet}
                            onChange={(e) => handleInputChange("maxBuyPerWallet", e.target.value)}
                            placeholder="e.g., 10000"
                            className="w-full px-4 py-3 border-2 border-[#121212]/20 rounded-xl focus:border-[#AFFF00] focus:outline-none transition-colors pr-24"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#121212]/50 font-medium">
                            tokens
                          </span>
                        </div>
                        <p className="text-xs text-[#121212]/50 mt-1">
                          Maximum tokens one wallet can buy during early phase
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#121212] mb-2">
                          Early Phase Duration *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.earlyPhaseDuration}
                            onChange={(e) => handleInputChange("earlyPhaseDuration", e.target.value)}
                            placeholder="24"
                            className="w-full px-4 py-3 border-2 border-[#121212]/20 rounded-xl focus:border-[#AFFF00] focus:outline-none transition-colors pr-24"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#121212]/50 font-medium">
                            hours
                          </span>
                        </div>
                        <p className="text-xs text-[#121212]/50 mt-1">
                          How long before public trading begins
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#121212] mb-2">
                          Phase Duration (Used for All Phases) *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.sessionDuration}
                            onChange={(e) => handleInputChange("sessionDuration", e.target.value)}
                            placeholder="0.05"
                            className="w-full px-4 py-3 border-2 border-[#121212]/20 rounded-xl focus:border-[#AFFF00] focus:outline-none transition-colors pr-24"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#121212]/50 font-medium">
                            hours
                          </span>
                        </div>
                        <p className="text-xs text-[#121212]/50 mt-1">
                          All 4 phases have equal duration. Token shows on Sessions page during Phase 2 (PRIVATE). Example: 0.05 = 3 min per phase.
                        </p>
                      </div>

                      <div className="flex items-start gap-3 p-4 border-2 border-[#121212]/10 rounded-xl">
                        <input
                          type="checkbox"
                          checked={formData.restrictTransfers}
                          onChange={(e) => handleInputChange("restrictTransfers", e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-2 border-[#121212]/20 checked:bg-[#AFFF00]"
                        />
                        <div>
                          <p className="font-bold text-[#121212] mb-1">Restrict Transfers During Early Phase</p>
                          <p className="text-sm text-[#121212]/70">
                            Prevent token transfers during early phase to ensure fair distribution
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setCurrentStep(1)}
                          variant="outline"
                          className="flex-1 border-2 border-[#121212] rounded-full py-6"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => setCurrentStep(3)}
                          disabled={!isStep2Valid}
                          className="flex-1 bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold py-6 rounded-full disabled:opacity-50"
                        >
                          Review Launch
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-bold text-blue-900 mb-1">Review Carefully</p>
                          <p className="text-sm text-blue-700">
                            Launch rules cannot be changed after deployment. Make sure everything is correct.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="border-2 border-[#121212]/10 rounded-xl p-4">
                          <h3 className="font-bold text-[#121212] mb-3 flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-[#AFFF00]" />
                            Token Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#121212]/60">Name:</span>
                              <span className="font-bold">{formData.tokenName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#121212]/60">Symbol:</span>
                              <span className="font-bold">{formData.tokenSymbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#121212]/60">Supply:</span>
                              <span className="font-bold">{Number(formData.totalSupply).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-[#AFFF00]/30 bg-[#AFFF00]/5 rounded-xl p-4">
                          <h3 className="font-bold text-[#121212] mb-3 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#AFFF00]" />
                            Fair Launch Rules
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#121212]/60">Max Buy:</span>
                              <span className="font-bold">{Number(formData.maxBuyPerWallet).toLocaleString()} tokens</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#121212]/60">Early Phase:</span>
                              <span className="font-bold">{formData.earlyPhaseDuration} hours</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#121212]/60">Session Duration:</span>
                              <span className="font-bold">{formData.sessionDuration} hours</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#121212]/60">Transfer Restrictions:</span>
                              <span className="font-bold">{formData.restrictTransfers ? "Enabled" : "Disabled"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setCurrentStep(2)}
                          variant="outline"
                          className="flex-1 border-2 border-[#121212] rounded-full py-6"
                          disabled={isLaunching}
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleLaunch}
                          disabled={isLaunching || !isConnected}
                          className="flex-1 bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold py-6 rounded-full disabled:opacity-50 relative overflow-hidden group"
                        >
                          {isLaunching ? (
                            <>
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                              />
                              <span className="relative z-10">Launching...</span>
                            </>
                          ) : !isConnected ? (
                            <>
                              <AlertCircle className="w-5 h-5 mr-2" />
                              Connect Wallet First
                            </>
                          ) : (
                            <>
                              <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                              Launch Token
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <Card className="border-2 border-[#AFFF00]/30 bg-[#AFFF00]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#AFFF00]" />
                    Why Fair Launch?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-[#AFFF00] flex-shrink-0" />
                    <div>
                      <p className="font-bold mb-1">No Insider Advantage</p>
                      <p className="text-[#121212]/70">Rules enforced at protocol level</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-[#AFFF00] flex-shrink-0" />
                    <div>
                      <p className="font-bold mb-1">Time-Based Phases</p>
                      <p className="text-[#121212]/70">Automatic transition to public trading</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Users className="w-5 h-5 text-[#AFFF00] flex-shrink-0" />
                    <div>
                      <p className="font-bold mb-1">Equal Opportunity</p>
                      <p className="text-[#121212]/70">Everyone gets the same max buy limit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#AFFF00]" />
                    Launch Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#121212]/60">Platform Fee:</span>
                    <span className="font-bold">0.1 SUI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#121212]/60">Gas Fee:</span>
                    <span className="font-bold">~0.01 SUI</span>
                  </div>
                  <div className="border-t-2 border-[#121212]/10 pt-3 flex justify-between font-bold">
                    <span>Total Estimated:</span>
                    <span className="text-[#AFFF00]">~0.11 SUI</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
