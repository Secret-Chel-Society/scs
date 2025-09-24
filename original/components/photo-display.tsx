"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useSupabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

interface PhotoDisplayProps {
  photoId?: string
  category?: string
  limit?: number
  className?: string
  aspectRatio?: "square" | "video" | "wide" | "portrait"
  objectFit?: "cover" | "contain"
}

type Photo = {
  id: string
  title: string
  description: string | null
  category: string
  url: string
}

export function PhotoDisplay({
  photoId,
  category = "general",
  limit = 1,
  className = "",
  aspectRatio = "video",
  objectFit = "cover",
}: PhotoDisplayProps) {
  const { supabase } = useSupabase()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPhotos() {
      setLoading(true)
      try {
        let query = supabase.from("photos").select("id, title, description, category, url")

        if (photoId) {
          query = query.eq("id", photoId)
        } else if (category) {
          query = query.eq("category", category)
        }

        query = query.order("created_at", { ascending: false }).limit(limit)

        const { data, error } = await query

        if (error) {
          throw error
        }

        setPhotos(data || [])
      } catch (err: any) {
        console.error("Error fetching photos:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [supabase, photoId, category, limit])

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square"
      case "video":
        return "aspect-video"
      case "wide":
        return "aspect-[21/9]"
      case "portrait":
        return "aspect-[3/4]"
      default:
        return "aspect-video"
    }
  }

  if (loading) {
    return <Skeleton className={`${getAspectRatioClass()} w-full ${className}`} />
  }

  if (error || photos.length === 0) {
    return (
      <div className={`${getAspectRatioClass()} w-full bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">No image available</span>
      </div>
    )
  }

  return (
    <div className={`relative ${getAspectRatioClass()} w-full overflow-hidden rounded-md ${className}`}>
      <Image
        src={photos[0].url || "/placeholder.svg"}
        alt={photos[0].title || "Photo"}
        fill
        className={`object-${objectFit}`}
      />
    </div>
  )
}
