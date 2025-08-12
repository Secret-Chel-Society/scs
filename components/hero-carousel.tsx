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

  // Default fallback content
  const defaultContent = {
    url: "/placeholder.svg?height=600&width=1200&text=MGHL",
    title: "Welcome to MGHL",
    subtitle: "The premier NHL 25 competitive gaming league",
  }

  // Filter out images with invalid URLs and add default if no valid images
  useEffect(() => {
    const filtered = images.filter((_, index) => !loadError[index])
    setValidImages(filtered.length > 0 ? filtered : [defaultContent])
  }, [images, loadError])

  // Auto-advance the carousel
  useEffect(() => {
    if (validImages.length <= 1) return // Don't set interval if only one image

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

  // Handle image load error
  const handleImageError = (index: number) => {
    console.warn(`Failed to load image at index ${index}:`, validImages[index]?.url)
    setLoadError((prev) => ({ ...prev, [index]: true }))

    // If the current image failed to load, move to the next one
    if (index === current && validImages.length > 1) {
      next()
    }
  }

  // Get the current image with fallback
  const currentImage = validImages[current] || defaultContent

  return (
    <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
      {/* Carousel Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <Image
            src={currentImage.url || "/placeholder.svg"}
            alt={currentImage.title || "Carousel image"}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            onError={() => handleImageError(current)}
            onLoad={() => {
              // Remove error state if image loads successfully
              setLoadError((prev) => {
                const newState = { ...prev }
                delete newState[current]
                return newState
              })
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
        <motion.div
          key={`content-${current}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-md">
            {currentImage.title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 drop-shadow-md">{currentImage.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/register/season">Season 1 Signup</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="bg-background/30 backdrop-blur-sm border-white/20 text-white hover:bg-background/50"
            >
              <Link href="/matches">View Matches</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Navigation Arrows - Only show if more than one image */}
      {validImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/30 backdrop-blur-sm text-white hover:bg-background/50 rounded-full h-10 w-10"
            onClick={prev}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/30 backdrop-blur-sm text-white hover:bg-background/50 rounded-full h-10 w-10"
            onClick={next}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {validImages.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === current ? "w-8 bg-primary" : "w-2 bg-white/50"
                }`}
                onClick={() => setCurrent(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === current ? "true" : "false"}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
