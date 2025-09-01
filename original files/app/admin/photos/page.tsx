"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhotoGallery } from "@/components/admin/photo-gallery"
import { PhotoUploader } from "@/components/admin/photo-uploader"
import { CarouselManager } from "@/components/admin/carousel-manager"
import { LogoManager } from "@/components/admin/logo-manager"
import { AdminProtected } from "@/components/auth/admin-protected"
import { useSearchParams, useRouter } from "next/navigation"

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
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Photo Management</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="upload">Upload Photos</TabsTrigger>
            <TabsTrigger value="gallery">Photo Gallery</TabsTrigger>
            <TabsTrigger value="carousel">Homepage Carousel</TabsTrigger>
            <TabsTrigger value="logos">Logo Management</TabsTrigger>
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
    </AdminProtected>
  )
}
