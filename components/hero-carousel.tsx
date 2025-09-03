"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Trophy, Gamepad2 } from "lucide-react"
// import { motion, AnimatePresence } from "framer-motion" // Commented out to fix build issues

interface HeroImage {
  url: string
  title: string
  subtitle: string
}

interface HeroCarouselProps {
  images?: HeroImage[]
}

export default function HeroCarousel({ images = [] }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [loadError, setLoadError] = useState<Record<number, boolean>>({})
  const [validImages, setValidImages] = useState<HeroImage[]>([])

  // ✅ Default fallback content uses your new PNG logo
  const defaultContent = {
    url: "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/logoheader/scslogo.png", // place this PNG in /public
    title: "Welcome to Secret CHEL Society",
    subtitle: "The premier NHL 26 competitive gaming league",
  }

  useEffect(() => {
    const filtered = images.filter((_, index) => !loadError[index])
    setValidImages(filtered.length > 0 ? filtered : [defaultContent])
  }, [images, loadError])

  useEffect(() => {
    if (validImages.length <= 1) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [validImages.length])

  const next = useCallback(
    () => setCurrent((prev) => (prev === validImages.length - 1 ? 0 : prev + 1)),
    [validImages.length],
  )
  const prev = useCallback(
    () => setCurrent((prev) => (prev === 0 ? validImages.length - 1 : prev - 1)),
    [validImages.length],
  )

  const handleImageError = (index: number) => {
    console.warn(`Failed to load image at index ${index}:`, validImages[index]?.url)
    setLoadError((prev) => ({ ...prev, [index]: true }))
    if (index === current && validImages.length > 1) next()
  }

  const currentImage = validImages[current] || defaultContent

  return (
    <div className="relative h-[600px] md:h-[700px] w-full overflow-hidden bg-gradient-to-br from-background via-primary/10 to-secondary/10 flex flex-col items-center justify-center">
      {/* Enhanced Professional Hockey Background */}
      <div className="absolute inset-0 hockey-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/15" />
      
      {/* Professional ice rink elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary opacity-80" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-secondary via-primary to-secondary opacity-80" />
      
      {/* Carousel Images with Enhanced Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-full w-full flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50" />
          <Image
            src={currentImage.url || "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/carousel/2D183079-0CA8-4A08-84F6-A6645094ADD7.png"}
            alt={currentImage.title || "Championship carousel"}
            width={600}
            height={600}
            className="object-contain relative z-10 filter drop-shadow-2xl"
            priority
            onError={() => handleImageError(current)}
          />
        </div>
      </div>

      {/* Enhanced Professional Content Overlay */}
      <div className="absolute bottom-20 inset-x-0 flex flex-col items-center text-center p-6">
        <div className="max-w-4xl">
          <div className="relative mb-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-primary/90 to-secondary/90 bg-clip-text text-transparent drop-shadow-2xl">
              {currentImage.title}
            </h1>
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl opacity-50" />
          </div>
          
          <p className="text-2xl md:text-3xl mb-12 text-white/95 drop-shadow-xl font-medium leading-relaxed max-w-3xl mx-auto">
            {currentImage.subtitle}
          </p>
          
          <div className="flex flex-wrap justify-center gap-8">
            <div>
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-2xl hover:shadow-3xl text-xl px-10 py-6 rounded-xl font-bold transition-all duration-300"
              >
                <Link href="/register/season" className="flex items-center gap-3">
                  <Trophy className="h-6 w-6" />
                  Championship Signup
                </Link>
              </Button>
            </div>
            
            <div>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="bg-background/40 backdrop-blur-lg border-2 border-white/30 text-white hover:bg-background/60 hover:border-white/50 shadow-xl hover:shadow-2xl text-xl px-10 py-6 rounded-xl font-bold transition-all duration-300"
              >
                <Link href="/matches" className="flex items-center gap-3">
                  <Gamepad2 className="h-6 w-6" />
                  View Arena
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Professional Navigation Arrows */}
      {validImages.length > 1 && (
        <>
          <div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-lg border border-primary/30 text-white hover:bg-gradient-to-r hover:from-primary/60 hover:to-secondary/60 hover:border-primary/50 rounded-full h-14 w-14 shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={prev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          </div>
          
          <div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-lg border border-primary/30 text-white hover:bg-gradient-to-r hover:from-secondary/60 hover:to-primary/60 hover:border-secondary/50 rounded-full h-14 w-14 shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={next}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
