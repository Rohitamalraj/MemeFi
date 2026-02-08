'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEnsRegistration } from '@/hooks/use-ens-registration'
import { useWalletMapping } from '@/hooks/use-wallet-mapping'
import { useAccount } from 'wagmi'
import { useWalletConnection } from '@/lib/use-wallet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle2, AlertCircle, Clock, ArrowRight, Link2, Wallet } from 'lucide-react'
import { formatEther } from 'viem'

interface ENSRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

type RegistrationStep = 'ens-register' | 'ens-waiting' | 'ens-complete' | 'wallet-mapping' | 'complete'

export function ENSRegistrationModal({ isOpen, onClose }: ENSRegistrationModalProps) {
  const [domainInput, setDomainInput] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [price, setPrice] = useState<bigint | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [step, setStep] = useState<RegistrationStep>('ens-register')

  // Wagmi hooks for Ethereum wallet
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  
  // Sui wallet hook
  const { address: suiAddress, isConnected: isSuiConnected } = useWalletConnection()

  const {
    isLoading: ensLoading,
    error: ensError,
    registeredName,
    registrationHash,
    currentStep: ensStep,
    getTimeRemaining,
    checkAvailability,
    getPrice,
    submitCommitment,
    registerDomain,
    getEnsExplorerUrl,
    getSepoliaExplorerUrl,
  } = useEnsRegistration()

  const {
    isLoading: mappingLoading,
    error: mappingError,
    createMapping,
  } = useWalletMapping()

  const isLoading = ensLoading || mappingLoading
  const error = ensError || mappingError

  // Update time remaining every second
  useEffect(() => {
    if (ensStep === 'waiting') {
      const interval = setInterval(() => {
        setTimeRemaining(getTimeRemaining())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [ensStep, getTimeRemaining])

  // When ENS registration completes, move to wallet mapping step
  useEffect(() => {
    if (registeredName && step === 'ens-complete') {
      // Auto-advance to wallet mapping after a short delay
      const timer = setTimeout(() => {
        setStep('wallet-mapping')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [registeredName, step])

  const handleCheckAvailability = async () => {
    if (!domainInput.trim()) return

    const available = await checkAvailability(domainInput)
    setIsAvailable(available)

    if (available) {
      const priceData = await getPrice(domainInput)
      setPrice(priceData)
    }
  }

  const handleRegisterClick = async () => {
    if (ensStep === 'idle') {
      // Step 1: Submit commitment
      const success = await submitCommitment(domainInput)
      if (success) {
        setTimeRemaining(60)
        setStep('ens-waiting')
      }
    } else if (ensStep === 'waiting' && timeRemaining <= 0) {
      // Step 2: Register domain
      const success = await registerDomain(domainInput)
      if (success) {
        setStep('ens-complete')
      }
    }
  }

  const handleCreateWalletMapping = async () => {
    if (!registeredName) return

    const success = await createMapping(registeredName)
    if (success) {
      setStep('complete')
    }
  }

  const handleClose = () => {
    // Reset all state
    setDomainInput('')
    setIsAvailable(null)
    setPrice(null)
    setStep('ens-register')
    onClose()
  }

  const canRegister = isAvailable && !isLoading && (ensStep === 'idle' || (ensStep === 'waiting' && timeRemaining <= 0))

  // Allow modal closing unless actively loading
  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      handleClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-[450px] sm:max-w-[550px] bg-black border-[#424242] text-white" onInteractOutside={(e) => {
        if (isLoading) {
          e.preventDefault()
        }
      }}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-sentient text-white">
            {step === 'complete' ? '🎉 Setup Complete!' : 'Cross-Chain ENS Setup'}
          </DialogTitle>
          <DialogDescription className="font-mono text-white/60">
            {step === 'complete' 
              ? 'Your ENS is now mapped to your Sui wallet'
              : 'Register ENS and map it to your Sui wallet for cross-chain transactions'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono ${
              ['ens-register', 'ens-waiting', 'ens-complete', 'wallet-mapping', 'complete'].includes(step)
                ? 'bg-primary text-black'
                : 'bg-[#424242] text-white/40'
            }`}>
              {['ens-complete', 'wallet-mapping', 'complete'].includes(step) ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-xs mt-1 font-mono text-white/60">ENS</span>
          </div>
          
          <div className="flex-1 h-0.5 bg-[#424242] mx-2">
            <div className={`h-full transition-all ${
              ['wallet-mapping', 'complete'].includes(step) ? 'bg-primary w-full' : 'bg-[#424242] w-0'
            }`} />
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono ${
              ['wallet-mapping', 'complete'].includes(step)
                ? 'bg-primary text-black'
                : 'bg-[#424242] text-white/40'
            }`}>
              {step === 'complete' ? <CheckCircle2 className="w-5 h-5" /> : '2'}
            </div>
            <span className="text-xs mt-1 font-mono text-white/60">Map</span>
          </div>

          <div className="flex-1 h-0.5 bg-[#424242] mx-2">
            <div className={`h-full transition-all ${
              step === 'complete' ? 'bg-primary w-full' : 'bg-[#424242] w-0'
            }`} />
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono ${
              step === 'complete'
                ? 'bg-primary text-black'
                : 'bg-[#424242] text-white/40'
            }`}>
              {step === 'complete' ? <CheckCircle2 className="w-5 h-5" /> : '3'}
            </div>
            <span className="text-xs mt-1 font-mono text-white/60">Done</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: ENS Registration */}
          {(step === 'ens-register' || step === 'ens-waiting') && (
            <motion.div
              key="ens-register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium font-mono text-white">Choose Your ENS Name</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="yourname"
                    value={domainInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setDomainInput(e.target.value)
                      setIsAvailable(null)
                      setPrice(null)
                    }}
                    disabled={isLoading || step === 'ens-waiting'}
                    className="flex-1 bg-black border-[#424242] text-white placeholder:text-white/40 font-mono"
                  />
                  <span className="flex items-center text-white/60 font-mono">.eth</span>
                </div>
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 font-mono">{error}</p>
                </div>
              )}

              {isAvailable !== null && (
                <div className={`p-4 rounded-lg border ${
                  isAvailable
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <p className="text-sm font-medium mb-2 font-mono text-white">
                    {isAvailable ? '✅ Domain is available!' : '❌ Domain is not available'}
                  </p>
                  {isAvailable && price !== null && (
                    <p className="text-sm text-white/60 font-mono">
                      Price: <span className="font-semibold text-primary">{formatEther(price)} ETH</span> per year
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {step === 'ens-register' && isAvailable === null && (
                  <Button
                    onClick={handleCheckAvailability}
                    disabled={!domainInput.trim() || isLoading}
                    className="flex-1 bg-primary text-black hover:bg-primary/90 font-bold font-mono"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Check Availability'
                    )}
                  </Button>
                )}

                {isAvailable !== null && step === 'ens-register' && (
                  <Button
                    onClick={() => {
                      setIsAvailable(null)
                      setPrice(null)
                    }}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 border-[#424242] text-white hover:bg-white/5 font-mono"
                  >
                    Check Different Domain
                  </Button>
                )}

                {isAvailable && (
                  <>
                    {step === 'ens-waiting' && timeRemaining > 0 && (
                      <Button disabled className="flex-1 bg-primary text-black font-mono font-bold">
                        <Clock className="w-4 h-4 mr-2" />
                        Wait {timeRemaining}s
                      </Button>
                    )}

                    {(step === 'ens-register' || (step === 'ens-waiting' && timeRemaining <= 0)) && (
                      <Button
                        onClick={handleRegisterClick}
                        disabled={!canRegister}
                        className="flex-1 bg-primary text-black hover:bg-primary/90 font-bold font-mono"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {step === 'ens-register' ? 'Starting...' : 'Registering...'}
                          </>
                        ) : step === 'ens-register' ? (
                          'Start Registration'
                        ) : (
                          'Complete Registration'
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: ENS Registration Complete */}
          {step === 'ens-complete' && registeredName && (
            <motion.div
              key="ens-complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <CheckCircle2 className="w-16 h-16 text-primary" />
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 font-sentient text-white">ENS Registered!</h3>
                <p className="text-lg font-mono text-primary mb-2">{registeredName}</p>
                <p className="text-sm text-white/60 font-mono">
                  Moving to wallet mapping...
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Wallet Mapping */}
          {step === 'wallet-mapping' && (
            <motion.div
              key="wallet-mapping"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2 font-sentient text-white">Map Wallets</h3>
                <p className="text-sm text-white/60 font-mono">
                  Connect your ENS to your Sui wallet for cross-chain transactions
                </p>
              </div>

              {/* Wallet Connection Status */}
              <div className="space-y-3">
                <div className="p-3 sm:p-4 border-2 border-[#424242] rounded-lg bg-[#121212]/50 overflow-hidden">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-xs sm:text-sm font-medium text-white font-mono">Ethereum Wallet</p>
                      <div className="text-xs text-white/60 font-mono break-all leading-tight">
                        {ethAddress || 'Not connected'}
                      </div>
                    </div>
                    {isEthConnected && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />}
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-5 h-5 text-white/40" />
                </div>

                <div className="p-3 sm:p-4 border-2 border-[#424242] rounded-lg bg-[#121212]/50 overflow-hidden">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-xs sm:text-sm font-medium text-white font-mono">Sui Wallet</p>
                      <div className="text-xs text-white/60 font-mono break-all leading-tight">
                        {suiAddress || 'Not connected'}
                      </div>
                    </div>
                    {isSuiConnected && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 font-mono">{error}</p>
                </div>
              )}

              <div className="bg-primary/10 border border-primary/30 p-3 rounded-lg">
                <p className="text-xs text-white/70 font-mono">
                  💡 After mapping, transactions using your ENS name ({registeredName}) will be processed on
                  the Sui blockchain using your connected Sui wallet.
                </p>
              </div>

              <Button
                onClick={handleCreateWalletMapping}
                disabled={!isEthConnected || !isSuiConnected || isLoading}
                className="w-full bg-primary text-black hover:bg-primary/90 font-bold font-mono"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Mapping...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Map Wallets
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <CheckCircle2 className="w-20 h-20 text-primary" />
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 font-sentient text-white">All Set!</h3>
                <p className="text-lg font-mono text-primary mb-4">{registeredName}</p>
                <p className="text-sm text-white/60 mb-6 font-mono">
                  Your ENS is now mapped to your Sui wallet. All transactions using this ENS
                  will be processed on Sui!
                </p>
              </div>

              {/* Mapping Summary */}
              <div className="w-full space-y-2 bg-[#121212]/50 p-4 rounded-lg border-2 border-[#424242]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60 font-mono">ENS Name:</span>
                  <span className="font-mono font-semibold text-white">{registeredName}</span>
                </div>
                <div className="flex items-center justify-center py-1">
                  <ArrowRight className="w-4 h-4 text-white/40" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60 font-mono">ETH Address:</span>
                  <span className="font-mono text-xs text-white">{ethAddress?.slice(0, 6)}...{ethAddress?.slice(-4)}</span>
                </div>
                <div className="flex items-center justify-center py-1">
                  <ArrowRight className="w-4 h-4 text-white/40" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60 font-mono">Sui Address:</span>
                  <span className="font-mono text-xs text-white">{suiAddress?.slice(0, 6)}...{suiAddress?.slice(-4)}</span>
                </div>
              </div>

              {/* Links */}
              {registeredName && registrationHash && (
                <div className="w-full space-y-2">
                  <a
                    href={getEnsExplorerUrl(registeredName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full p-3 bg-[#121212]/50 border border-[#424242] rounded-lg hover:border-primary transition text-center text-sm font-mono text-white"
                  >
                    View on ENS App →
                  </a>
                  <a
                    href={getSepoliaExplorerUrl(registrationHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full p-3 bg-[#121212]/50 border border-[#424242] rounded-lg hover:border-primary transition text-center text-sm font-mono text-white"
                  >
                    View Transaction →
                  </a>
                </div>
              )}

              <Button onClick={handleClose} className="w-full mt-4 bg-primary text-black hover:bg-primary/90 font-bold font-mono">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
