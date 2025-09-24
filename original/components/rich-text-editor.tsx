"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TextStyle from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  LinkIcon,
  ImageIcon,
  Undo,
  Redo,
  Code,
  Quote,
  Minus,
  Palette,
  Shield,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import NextImage from "next/image"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

interface TeamLogo {
  name: string
  url: string
  path: string
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write your content here...",
}: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [teamLogosDialogOpen, setTeamLogosDialogOpen] = useState(false)
  const [teamLogos, setTeamLogos] = useState<TeamLogo[]>([])
  const [loadingLogos, setLoadingLogos] = useState(false)

  const { supabase } = useSupabase()
  const { toast } = useToast()

  // Predefined colors for the color picker
  const colors = [
    "#000000",
    "#374151",
    "#6B7280",
    "#9CA3AF",
    "#D1D5DB",
    "#F3F4F6",
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#EAB308",
    "#84CC16",
    "#22C55E",
    "#10B981",
    "#14B8A6",
    "#06B6D4",
    "#0EA5E9",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#A855F7",
    "#D946EF",
    "#EC4899",
    "#F43F5E",
  ]

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full h-auto my-4 team-logo-inline",
        },
        inline: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
  })

  // Fetch team logos from Supabase storage
  const fetchTeamLogos = async () => {
    setLoadingLogos(true)
    try {
      const { data: files, error } = await supabase.storage.from("media").list("team-logos", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      })

      if (error) {
        console.error("Error fetching team logos:", error)
        toast({
          title: "Error",
          description: "Failed to load team logos",
          variant: "destructive",
        })
        return
      }

      if (files) {
        const logoFiles = files
          .filter((file) => file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i))
          .map((file) => {
            const { data: urlData } = supabase.storage.from("media").getPublicUrl(`team-logos/${file.name}`)

            return {
              name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
              url: urlData.publicUrl,
              path: `team-logos/${file.name}`,
            }
          })

        setTeamLogos(logoFiles)
      }
    } catch (error) {
      console.error("Error fetching team logos:", error)
      toast({
        title: "Error",
        description: "Failed to load team logos",
        variant: "destructive",
      })
    } finally {
      setLoadingLogos(false)
    }
  }

  // Load team logos when dialog opens
  useEffect(() => {
    if (teamLogosDialogOpen && teamLogos.length === 0) {
      fetchTeamLogos()
    }
  }, [teamLogosDialogOpen])

  if (!editor) {
    return null
  }

  const addLink = () => {
    if (linkUrl) {
      const url = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
      setLinkUrl("")
      setLinkDialogOpen(false)
    }
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl("")
      setImageDialogOpen(false)
    }
  }

  const insertTeamLogo = (logo: TeamLogo) => {
    editor
      .chain()
      .focus()
      .setImage({
        src: logo.url,
        alt: logo.name,
        title: logo.name,
      })
      .run()

    // After inserting, apply inline styles to make it H1 size
    setTimeout(() => {
      const images = editor.view.dom.querySelectorAll('img[src="' + logo.url + '"]')
      const lastImage = images[images.length - 1] as HTMLImageElement
      if (lastImage) {
        lastImage.style.height = "2rem" // H1 size (32px)
        lastImage.style.width = "auto"
        lastImage.style.display = "inline"
        lastImage.style.verticalAlign = "middle"
        lastImage.style.margin = "0 0.25rem"
      }
    }, 100)

    setTeamLogosDialogOpen(false)
  }

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
  }

  const removeTextColor = () => {
    editor.chain().focus().unsetColor().run()
  }

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap gap-1 p-1 border-b bg-muted/50">
        <TooltipProvider delayDuration={300}>
          {/* Text Formatting */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("bold")}
                  onPressedChange={() => editor.chain().focus().toggleBold().run()}
                  aria-label="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("italic")}
                  onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                  aria-label="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("code")}
                  onPressedChange={() => editor.chain().focus().toggleCode().run()}
                  aria-label="Code"
                >
                  <Code className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Code</TooltipContent>
            </Tooltip>

            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Text Color</div>
                  <div className="grid grid-cols-6 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                        onClick={() => setTextColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={removeTextColor} className="w-full">
                    Remove Color
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Headings */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("heading", { level: 1 })}
                  onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  aria-label="Heading 1"
                >
                  <Heading1 className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Heading 1</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("heading", { level: 2 })}
                  onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  aria-label="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Heading 2</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("heading", { level: 3 })}
                  onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  aria-label="Heading 3"
                >
                  <Heading3 className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Heading 3</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("paragraph")}
                  onPressedChange={() => editor.chain().focus().setParagraph().run()}
                  aria-label="Paragraph"
                >
                  <Pilcrow className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Paragraph</TooltipContent>
            </Tooltip>
          </div>

          {/* Lists */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("bulletList")}
                  onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                  aria-label="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("orderedList")}
                  onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                  aria-label="Ordered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Ordered List</TooltipContent>
            </Tooltip>
          </div>

          {/* Block elements */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("blockquote")}
                  onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                  aria-label="Quote"
                >
                  <Quote className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Quote</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
                  aria-label="Horizontal Rule"
                >
                  <Minus className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Horizontal Rule</TooltipContent>
            </Tooltip>
          </div>

          {/* Links and Images */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("link")}
                  onPressedChange={() => {
                    if (editor.isActive("link")) {
                      editor.chain().focus().unsetLink().run()
                    } else {
                      setLinkDialogOpen(true)
                    }
                  }}
                  aria-label="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>{editor.isActive("link") ? "Unlink" : "Link"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle size="sm" onPressedChange={() => setImageDialogOpen(true)} aria-label="Image">
                  <ImageIcon className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle size="sm" onPressedChange={() => setTeamLogosDialogOpen(true)} aria-label="Team Logos">
                  <Shield className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Team Logos</TooltipContent>
            </Tooltip>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  onPressedChange={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  aria-label="Undo"
                >
                  <Undo className={cn("h-4 w-4", !editor.can().undo() && "opacity-50")} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  onPressedChange={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  aria-label="Redo"
                >
                  <Redo className={cn("h-4 w-4", !editor.can().redo() && "opacity-50")} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-sm sm:prose-base max-w-none p-4 focus:outline-none min-h-[300px] dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg [&_.team-logo-inline]:h-8 [&_.team-logo-inline]:w-auto [&_.team-logo-inline]:inline [&_.team-logo-inline]:align-middle [&_.team-logo-inline]:mx-1 [&_.team-logo-inline]:my-0"
      />

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addLink()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addLink}>Add Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addImage()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addImage}>Add Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Logos Dialog */}
      <Dialog open={teamLogosDialogOpen} onOpenChange={setTeamLogosDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Insert Team Logo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loadingLogos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading team logos...</span>
              </div>
            ) : teamLogos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No team logos found in the media/team-logos folder.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {teamLogos.map((logo) => (
                  <button
                    key={logo.path}
                    onClick={() => insertTeamLogo(logo)}
                    className="flex flex-col items-center p-2 rounded-lg border hover:border-primary hover:bg-accent transition-colors"
                    title={logo.name}
                  >
                    <div className="relative w-12 h-12 mb-2">
                      <NextImage
                        src={logo.url || "/placeholder.svg"}
                        alt={logo.name}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                    <span className="text-xs text-center truncate w-full">{logo.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamLogosDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add named export for RichTextEditor
export { RichTextEditor }
