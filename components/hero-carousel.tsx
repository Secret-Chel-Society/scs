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
    url: "/2D183079-0CA8-4A08-84F6-A6645094ADD7.png", // place this PNG in /public
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
    <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden bg-black flex flex-col items-center justify-center">
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
            src={currentImage.url || "/placeholder.svg"}
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-md">
            {currentImage.title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 drop-shadow-md">{currentImage.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/register/season">Season 2 Signup</Link>
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

      {/* Nav arrows if >1 image */}
      {validImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/30 backdrop-blur-sm text-white hover:bg-background/50 rounded-full h-10 w-10"
            onClick={prev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/30 backdrop-blur-sm text-white hover:bg-background/50 rounded-full h-10 w-10"
            onClick={next}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  )
}
