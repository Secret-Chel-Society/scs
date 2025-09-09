"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
    <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden hero-background flex flex-col items-center justify-center">
      {/* Hero UI-inspired background elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-ice-blue-500/20 to-rink-blue-500/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-br from-assist-green-500/20 to-goal-red-500/20 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-hockey-silver-500/30 to-ice-blue-500/30 rounded-full blur-lg"></div>
      {/* Carousel Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Image
            src={currentImage.url || "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/carousel/2D183079-0CA8-4A08-84F6-A6645094ADD7.png"}
            alt={currentImage.title || "Carousel image"}
            width={500}
            height={500}
            className="object-contain"
            priority
            onError={() => handleImageError(current)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute bottom-16 inset-x-0 flex flex-col items-center text-center p-4">
        <motion.div
          key={`content-${current}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-3xl"
        >
          <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl mb-6 drop-shadow-md">
            {currentImage.title}
          </h1>
          <p className="hero-subtitle text-xl md:text-2xl mb-8 text-slate-200 drop-shadow-md">{currentImage.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="hero-button">
              <Link href="/register/season">Season 1 Signup</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="hero-button-secondary"
            >
              <Link href="/matches">View Matches</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Nav arrows if >1 image */}
      {validImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-hockey-silver-800/30 backdrop-blur-sm text-hockey-silver-200 hover:bg-hockey-silver-700/50 hover:text-ice-blue-300 rounded-full h-10 w-10 transition-all duration-200"
            onClick={prev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-hockey-silver-800/30 backdrop-blur-sm text-hockey-silver-200 hover:bg-hockey-silver-700/50 hover:text-ice-blue-300 rounded-full h-10 w-10 transition-all duration-200"
            onClick={next}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  )
}
