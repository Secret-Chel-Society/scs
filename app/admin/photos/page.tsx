"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhotoGallery } from "@/components/admin/photo-gallery"
import { PhotoUploader } from "@/components/admin/photo-uploader"
import { CarouselManager } from "@/components/admin/carousel-manager"
import { LogoManager } from "@/components/admin/logo-manager"
import { AdminProtected } from "@/components/auth/admin-protected"
import { useSearchParams, useRouter } from "next/navigation"
import { Camera, Upload, Image, Carousel, Palette } from "lucide-react"

export default function AdminPhotosPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("upload")

  // Initialize tab from URL on component mount
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && ["upload", "gallery", "carousel", "logos"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Update URL with the new tab
    const params = new URLSearchParams(searchParams)
    params.set("tab", value)
    router.push(`/admin/photos?${params.toString()}`, { scroll: false })
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Camera className="h-8 w-8 text-blue-400" />
              Photo Management
            </h1>
            <p className="text-white/70 text-lg">
              Upload, manage, and organize photos for the platform
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-slate-800/50 border border-white/20">
              <TabsTrigger value="upload" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Photos
              </TabsTrigger>
              <TabsTrigger value="gallery" className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Photo Gallery
              </TabsTrigger>
              <TabsTrigger value="carousel" className="text-white data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 flex items-center gap-2">
                <Carousel className="h-4 w-4" />
                Homepage Carousel
              </TabsTrigger>
              <TabsTrigger value="logos" className="text-white data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Logo Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <PhotoUploader />
            </TabsContent>

            <TabsContent value="gallery" className="space-y-4">
              <PhotoGallery />
            </TabsContent>

            <TabsContent value="carousel" className="space-y-4">
              <CarouselManager />
            </TabsContent>

            <TabsContent value="logos" className="space-y-4">
              <LogoManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminProtected>
  )
}
