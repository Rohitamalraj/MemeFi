"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Rocket, Info, Shield, Clock, Users, TrendingUp, CheckCircle, AlertCircle, ExternalLink, Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTokenLaunch } from "@/lib/use-contracts"
import { useWalletConnection } from "@/lib/use-wallet"
import { getExplorerUrl } from "@/lib/contract-config"
import { uploadImage, validateImageFile } from "@/lib/walrus"
import { saveTokenImage, getTokenImage } from "@/lib/token-metadata"
import { toast } from "sonner"

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
      ease: "easeInOut" as const,
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

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleInputChange = (field: keyof LaunchFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid image file')
      return
    }

    // Set file and create preview
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    toast.success('Image selected! Tip: Add a backup URL below in case Walrus upload fails.', { duration: 4000 })
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, imageUrl: '' }))
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

    try {
      // Upload image to Walrus first if an image file is selected
      let imageUrl = formData.imageUrl // Start with any direct URL provided
      
      if (imageFile) {
        setIsUploadingImage(true)
        toast.info('Uploading image to Walrus...', { duration: 3000 })
        console.log('📤 Uploading image to Walrus:', imageFile.name)
        
        try {
          const walrusUrl = await uploadImage(imageFile, 5) // Store for 5 epochs
          console.log('✅ Image uploaded to Walrus:', walrusUrl)
          toast.success('Image uploaded to Walrus!')
          imageUrl = walrusUrl // Use Walrus URL if successful
          
          // Store the Walrus URL in form data for future reference
          setFormData(prev => ({ ...prev, imageUrl: walrusUrl }))
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError)
          
          // If we have a fallback URL from the input field, use that
          if (formData.imageUrl) {
            toast.warning('Walrus upload failed. Using provided URL instead.')
            imageUrl = formData.imageUrl
          } else {
            toast.error('Failed to upload image to Walrus. Launching without image.')
            imageUrl = '' // Continue without image
          }
        } finally {
          setIsUploadingImage(false)
        }
      }

      const totalSupply = Number.parseInt(formData.totalSupply)
      const maxBuyPerWallet = Number.parseInt(formData.maxBuyPerWallet)
      
      // Calculate durations in milliseconds
      // Early phase duration (LAUNCH phase only)
      const earlyPhaseDurationMs = Math.floor(parseFloat(formData.earlyPhaseDuration) * 60 * 60 * 1000)
      // Session/phase duration (for PRIVATE, SETTLEMENT, and beyond)
      const phaseDurationMs = Math.floor(parseFloat(formData.sessionDuration) * 60 * 60 * 1000)

      const launchParams = {
        name: formData.tokenName,
        symbol: formData.tokenSymbol,
        totalSupply,
        maxBuyPerWallet,
        earlyPhaseDurationMs,
        phaseDurationMs,
        transfersLocked: formData.restrictTransfers,
      };

      console.log('📋 Launch parameters:', launchParams);
      console.log(`  Early phase (LAUNCH): ${earlyPhaseDurationMs}ms (${earlyPhaseDurationMs/1000/60} minutes)`);
      console.log(`  Session phase (PRIVATE): ${phaseDurationMs}ms (${phaseDurationMs/1000/60} minutes)`);
      console.log(`  Image URL: ${imageUrl}`);

      const result = await launchToken(launchParams);
      
      console.log('🎯 Launch result:', result);      
      // If launch successful and we have an image URL, save it to metadata
      if (result.success && imageUrl && result.objectChanges) {
        try {
          console.log('🔍 All object changes:', JSON.stringify(result.objectChanges, null, 2));
          
          // Find the created token object - simplified pattern matching
          const createdObject = result.objectChanges.find(
            (change: any) => 
              change.type === 'created' && 
              change.objectType?.includes('MemeToken')
          );
          
          if (createdObject) {
            const tokenId = createdObject.objectId;
            console.log('✅ Token found with ID:', tokenId);
            console.log('💾 Saving image URL:', imageUrl);
            saveTokenImage(tokenId, imageUrl);
            console.log('✅ Metadata saved to localStorage');
            
            // Verify the save
            const saved = getTokenImage(tokenId);
            console.log('🔍 Verification - retrieved from storage:', saved);
            toast.success('Token metadata saved!');
          } else {
            console.warn('⚠️ Could not find MemeToken object');
            console.log('📋 Available objects:', result.objectChanges.map((c: any) => ({ 
              type: c.type, 
              objectType: c.objectType,
              objectId: c.objectId 
            })));
            
            // Fallback: Use first created object
            const anyCreated = result.objectChanges.find((change: any) => change.type === 'created');
            if (anyCreated) {
              console.log('🔄 Using fallback object:', anyCreated.objectId);
              saveTokenImage(anyCreated.objectId, imageUrl);
              toast.success('Token metadata saved (fallback)!');
            }
          }
        } catch (metadataError) {
          console.error('❌ Error saving token metadata:', metadataError);
          // Don't fail the launch if metadata save fails
        }
      }    } catch (error) {
      console.error('❌ Launch error:', error)
      toast.error('Failed to launch token')
    }
  }

  const steps = [
    { number: 1, title: "Token Info", icon: Rocket },
    { number: 2, title: "Fair Launch Rules", icon: Shield },
    { number: 3, title: "Review & Launch", icon: CheckCircle },
  ]

  const isStep1Valid = formData.tokenName && formData.tokenSymbol && formData.totalSupply
  const isStep2Valid = formData.maxBuyPerWallet && formData.sessionDuration

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen">
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
            className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-black" />
          </motion.div>
          <div>
            <h2 className="text-4xl font-bold text-white mb-4 font-sentient">Launch Successful! 🚀</h2>
            <p className="text-xl text-white/70 mb-2 font-mono">
              <span className="font-bold text-primary">{formData.tokenSymbol}</span> is now live on Sui
            </p>
            <p className="text-sm text-white/50 font-mono">
              Transaction: {launchResult.digest?.slice(0, 8)}...{launchResult.digest?.slice(-6)}
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            {launchResult.explorerUrl && (
              <a href={launchResult.explorerUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary text-black hover:bg-primary/90 font-bold font-mono px-8">
                  View on Explorer
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            )}
            <Button variant="outline" className="border-2 border-white/20 text-white hover:bg-white/10 font-mono px-8" onClick={() => {
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
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-sentient">
              Launch Your <span className="text-primary">Memecoin</span>
            </h1>
            <p className="text-xl text-white/70 font-mono">
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold font-mono border-2 transition-all ${
                      currentStep >= step.number
                        ? "bg-primary border-primary text-black"
                        : "bg-black border-white/20 text-white/40"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`hidden md:block font-medium font-mono ${
                      currentStep >= step.number ? "text-white" : "text-white/40"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 md:w-24 h-0.5 mx-2 ${
                      currentStep > step.number ? "bg-primary" : "bg-white/20"
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
              <Card className="border border-[#424242] bg-[#121212]/50">
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
                        <label className="block text-sm font-bold text-white mb-2 font-mono">
                          Token Name *
                        </label>
                        <input
                          type="text"
                          value={formData.tokenName}
                          onChange={(e) => handleInputChange("tokenName", e.target.value)}
                          placeholder="e.g., Pepe Moon"
                          className="w-full px-4 py-3 bg-black border border-[#424242] text-white placeholder:text-white/40 focus:border-primary focus:outline-none transition-colors font-mono"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-white mb-2 font-mono">
                            Token Symbol *
                          </label>
                          <input
                            type="text"
                            value={formData.tokenSymbol}
                            onChange={(e) => handleInputChange("tokenSymbol", e.target.value.toUpperCase())}
                            placeholder="e.g., PEPE"
                            className="w-full px-4 py-3 bg-black border border-[#424242] text-white placeholder:text-white/40 focus:border-primary focus:outline-none transition-colors uppercase font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white mb-2 font-mono">
                            Total Supply *
                          </label>
                          <input
                            type="text"
                            value={formData.totalSupply}
                            onChange={(e) => handleInputChange("totalSupply", e.target.value)}
                            placeholder="e.g., 1000000000"
                            className="w-full px-4 py-3 bg-black border border-[#424242] text-white placeholder:text-white/40 focus:border-primary focus:outline-none transition-colors font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2 font-mono">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          placeholder="Tell people about your memecoin..."
                          rows={4}
                          className="w-full px-4 py-3 bg-black border border-[#424242] text-white placeholder:text-white/40 focus:border-primary focus:outline-none transition-colors resize-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2 font-mono">
                          Token Image
                        </label>
                        
                        {!imagePreview ? (
                          <div className="space-y-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                              id="image-upload"
                            />
                            <label
                              htmlFor="image-upload"
                              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#424242] hover:border-primary transition-colors cursor-pointer bg-primary/5 hover:bg-primary/10"
                            >
                              <Upload className="w-10 h-10 text-white/40 mb-2" />
                              <p className="text-sm font-medium text-white/70 font-mono">Click to upload image</p>
                              <p className="text-xs text-white/50 mt-1 font-mono">PNG, JPG, GIF, WebP or SVG (max 10MB)</p>
                              <p className="text-xs text-primary font-bold mt-2 font-mono">🔒 Will upload to Walrus Storage</p>
                            </label>
                            
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/20"></div>
                              </div>
                              <div className="relative flex justify-center text-xs">
                                <span className="bg-black px-2 text-white/50 font-mono">OR use direct URL</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={formData.imageUrl}
                                onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                                placeholder="https://i.imgur.com/yourimage.png"
                                className="w-full px-4 py-3 bg-black border border-[#424242] text-white placeholder:text-white/40 focus:border-primary focus:outline-none transition-colors font-mono"
                              />
                              <p className="text-xs text-white/50 font-mono">
                                💡 <strong>Recommended:</strong> Use a direct image URL from Imgur, Cloudinary, or GitHub. 
                                Walrus testnet may be temporarily unavailable.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative w-full h-40 overflow-hidden border-2 border-primary group">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="bg-red-500 hover:bg-red-600 text-white p-2"
                                  size="sm"
                                >
                                  <X className="w-5 h-5" />
                                </Button>
                              </div>
                              <div className="absolute bottom-2 left-2 bg-primary text-black text-xs font-bold px-2 py-1 font-mono">
                                ✓ Ready for Walrus
                              </div>
                            </div>
                            
                            <div className="bg-orange-500/10 border border-orange-500/30 p-3">
                              <p className="text-xs font-bold text-orange-400 mb-2 font-mono">
                                ⚠️ Add Backup URL (Highly Recommended)
                              </p>
                              <input
                                type="text"
                                value={formData.imageUrl}
                                onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                                placeholder="https://i.imgur.com/yourimage.png (backup if Walrus fails)"
                                className="w-full px-4 py-2 bg-black border border-orange-500/20 text-white placeholder:text-white/40 focus:border-orange-400 focus:outline-none transition-colors text-sm font-mono"
                              />
                              <p className="text-xs text-orange-300 mt-1 font-mono">
                                If the Walrus upload fails, this URL will be used instead.
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="bg-blue-500/10 border border-blue-500/30 p-3 mt-2">
                          <p className="text-xs text-blue-400 font-mono">
                            <strong>📸 Image Options:</strong>
                          </p>
                          <ul className="text-xs text-blue-300 mt-1 ml-4 list-disc space-y-1 font-mono">
                            <li><strong>Recommended:</strong> Paste a direct image URL (instant, reliable)</li>
                            <li>Upload file: We'll try Walrus storage (experimental, may fail)</li>
                            <li>If Walrus fails, your fallback URL will be used automatically</li>
                          </ul>
                        </div>
                      </div>

                      <Button
                        onClick={() => setCurrentStep(2)} 
                        disabled={!isStep1Valid}
                        className="w-full bg-primary text-black hover:bg-primary/90 font-bold font-mono py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="bg-primary/10 border border-primary/30 p-4 flex gap-3">
                        <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-bold text-white mb-1 font-mono">Protocol-Enforced Fairness</p>
                          <p className="text-sm text-white/70 font-mono">
                            These rules are embedded in the token object and cannot be changed after launch
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2 font-mono">
                          Max Buy Per Wallet (Early Phase) *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.maxBuyPerWallet}
                            onChange={(e) => handleInputChange("maxBuyPerWallet", e.target.value)}
                            placeholder="e.g., 10000"
                            className="w-full px-4 py-3 bg-black border border-[#424442] text-white placeholder:text-white/40 focus:border-primary focus:outline-none transition-colors pr-24 font-mono"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium font-mono">
                            tokens
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1 font-mono">
                          Maximum tokens one wallet can buy during early phase
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2 font-mono">
                          Early Phase Duration *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.earlyPhaseDuration}
                            onChange={(e) => handleInputChange("earlyPhaseDuration", e.target.value)}
                            placeholder="24"
                            className="w-full px-4 py-3 bg-black border border-[#424242] text-white placeholder:text-white/40 focus:border-primary focus:outline-none transition-colors pr-24 font-mono"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium font-mono">
                            hours
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1 font-mono">
                          How long before public trading begins
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2 font-mono">
                          Phase Duration (Used for All Phases) *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.sessionDuration}
                            onChange={(e) => handleInputChange("sessionDuration", e.target.value)}
                            placeholder="0.05"
                            className="w-full px-4 py-3 bg-black border border-[#424242] text-white placeholder:text-white/40 focus:border-primary focus:outline-none transition-colors pr-24 font-mono"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium font-mono">
                            hours
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1 font-mono">
                          All 4 phases have equal duration. Token shows on Sessions page during Phase 2 (PRIVATE). Example: 0.05 = 3 min per phase.
                        </p>
                      </div>

                      <div className="flex items-start gap-3 p-4 border border-white/10">
                        <input
                          type="checkbox"
                          checked={formData.restrictTransfers}
                          onChange={(e) => handleInputChange("restrictTransfers", e.target.checked)}
                          className="mt-1 w-5 h-5 border border-white/20 checked:bg-primary"
                        />
                        <div>
                          <p className="font-bold text-white mb-1 font-mono">Restrict Transfers During Early Phase</p>
                          <p className="text-sm text-white/70 font-mono">
                            Prevent token transfers during early phase to ensure fair distribution
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setCurrentStep(1)}
                          variant="outline"
                          className="flex-1 border border-white/20 text-white hover:bg-white/10 py-6 font-mono"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => setCurrentStep(3)}
                          disabled={!isStep2Valid}
                          className="flex-1 bg-primary text-black hover:bg-primary/90 font-bold font-mono py-6 disabled:opacity-50"
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
                      <div className="bg-blue-500/10 border border-blue-500/30 p-4 flex gap-3">
                        <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-bold text-blue-300 mb-1 font-mono">Review Carefully</p>
                          <p className="text-sm text-blue-200 font-mono">
                            Launch rules cannot be changed after deployment. Make sure everything is correct.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="border border-white/10 p-4">
                          <h3 className="font-bold text-white mb-3 flex items-center gap-2 font-mono">
                            <Rocket className="w-5 h-5 text-primary" />
                            Token Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-white/60 font-mono">Name:</span>
                              <span className="font-bold text-white font-mono">{formData.tokenName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60 font-mono">Symbol:</span>
                              <span className="font-bold text-white font-mono">{formData.tokenSymbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60 font-mono">Supply:</span>
                              <span className="font-bold text-white font-mono">{Number(formData.totalSupply).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-primary/30 bg-primary/5 p-4">
                          <h3 className="font-bold text-white mb-3 flex items-center gap-2 font-mono">
                            <Shield className="w-5 h-5 text-primary" />
                            Fair Launch Rules
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-white/60 font-mono">Max Buy:</span>
                              <span className="font-bold text-white font-mono">{Number(formData.maxBuyPerWallet).toLocaleString()} tokens</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60 font-mono">Early Phase:</span>
                              <span className="font-bold text-white font-mono">{formData.earlyPhaseDuration} hours</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60 font-mono">Session Duration:</span>
                              <span className="font-bold text-white font-mono">{formData.sessionDuration} hours</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60 font-mono">Transfer Restrictions:</span>
                              <span className="font-bold text-white font-mono">{formData.restrictTransfers ? "Enabled" : "Disabled"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setCurrentStep(2)}
                          variant="outline"
                          className="flex-1 border border-white/20 text-white hover:bg-white/10 py-6 font-mono"
                          disabled={isLaunching}
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleLaunch}
                          disabled={isLaunching || !isConnected}
                          className="flex-1 bg-primary text-black hover:bg-primary/90 font-bold font-mono py-6 disabled:opacity-50 relative overflow-hidden group"
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
              <Card className="border border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-mono">
                    <Info className="w-5 h-5 text-primary" />
                    Why Fair Launch?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-bold mb-1 text-white font-mono">No Insider Advantage</p>
                      <p className="text-white/70 font-mono">Rules enforced at protocol level</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-bold mb-1 text-white font-mono">Time-Based Phases</p>
                      <p className="text-white/70 font-mono">Automatic transition to public trading</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Users className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-bold mb-1 text-white font-mono">Equal Opportunity</p>
                      <p className="text-white/70 font-mono">Everyone gets the same max buy limit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-[#424242] bg-[#121212]/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-mono">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Launch Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60 font-mono">Platform Fee:</span>
                    <span className="font-bold text-white font-mono">0.1 SUI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-mono">Gas Fee:</span>
                    <span className="font-bold text-white font-mono">~0.01 SUI</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                    <span className="text-white font-mono">Total Estimated:</span>
                    <span className="text-primary font-mono">~0.11 SUI</span>
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
