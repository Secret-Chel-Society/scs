"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhotoGallery } from "@/components/admin/photo-gallery"
import { PhotoUploader } from "@/components/admin/photo-uploader"
import { CarouselManager } from "@/components/admin/carousel-manager"
import { LogoManager } from "@/components/admin/logo-manager"
import { AdminProtected } from "@/components/auth/admin-protected"
import { useSearchParams, useRouter } from "next/navigation"
import { Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
          <div className="relative container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
              <ArrowLeft className="h-5 w-5 text-white/70" />
              <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
                Back to Admin Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                <Camera className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Photo Management
                </h1>
                <p className="text-white/70 mt-1">Manage photos, carousel, and logo assets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-slate-800/50 border border-white/20">
              <TabsTrigger value="upload" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Upload Photos</TabsTrigger>
              <TabsTrigger value="gallery" className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Photo Gallery</TabsTrigger>
              <TabsTrigger value="carousel" className="text-white data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">Homepage Carousel</TabsTrigger>
              <TabsTrigger value="logos" className="text-white data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">Logo Management</TabsTrigger>
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
