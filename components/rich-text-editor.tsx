"use client"

import { useEditor, EditorContent, Node, mergeAttributes } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"

import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import FontFamily from "@tiptap/extension-font-family"
import TextAlign from "@tiptap/extension-text-align"

import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"

import Youtube from "@tiptap/extension-youtube"

import Papa from "papaparse"

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
  VideoIcon,
  TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  StretchHorizontal,
  Type,
  Upload,
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

const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
      autoplay: {
        default: false,
      },
      loop: {
        default: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "video",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { class: "rounded-md w-full my-4" })]
  },

  addCommands() {
    return {
      setVideo:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write your content here...",
}: RichTextEditorProps) {
  // dialogs + inputs
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")

  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [csvText, setCsvText] = useState("")
  const [csvHasHeader, setCsvHasHeader] = useState(true)

  // team logos
  const [teamLogosDialogOpen, setTeamLogosDialogOpen] = useState(false)
  const [teamLogos, setTeamLogos] = useState<TeamLogo[]>([])
  const [loadingLogos, setLoadingLogos] = useState(false)

  const { supabase } = useSupabase()
  const { toast } = useToast()

  // color palette
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
      StarterKit, // headings, lists, quote, code, hr, etc.

      // inline styles
      TextStyle, // required for Color + font-size
      Color,

      // typography & layout
      FontFamily.configure({ types: ["textStyle", "paragraph", "heading"] }), // include headings
      TextAlign.configure({ types: ["heading", "paragraph"] }),

      // links & media
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary" }, // no underline per your request
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-md max-w-full h-auto my-4 team-logo-inline" },
        inline: true,
      }),
      Video, // custom HTML5 <video> node
      Youtube.configure({
        modestBranding: true,
        controls: true,
        nocookie: true,
        allowFullscreen: true,
        HTMLAttributes: { class: "rounded-md w-full aspect-video my-4" },
      }),

      // tables
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,

      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none p-4 focus:outline-none min-h-[300px] dark:prose-invert " +
          "prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg " +
          "[&_.team-logo-inline]:h-8 [&_.team-logo-inline]:w-auto [&_.team-logo-inline]:inline [&_.team-logo-inline]:align-middle [&_.team-logo-inline]:mx-1 [&_.team-logo-inline]:my-0",
      },
    },
  })

  // keep selection/focus in editor when clicking toolbar
  const keepSelection = (e: any) => e.preventDefault()

  // -------- CSV → Table helpers --------
  function parseCsvToArray(text: string): string[][] {
    const res = Papa.parse<string[]>(text.trim(), {
      delimiter: "", // auto
      newline: "", // auto
      quoteChar: '"',
      escapeChar: '"',
      skipEmptyLines: "greedy",
      transform: (val) => (val === null || val === undefined ? "" : String(val)),
    })
    const data = (res.data || []).filter((row) => row && row.length > 0)
    return data as string[][]
  }

  function insertArrayAsTable(data: string[][], withHeaderRow: boolean) {
    if (!editor || !data.length) return

    const schema = editor.schema
    const header = withHeaderRow ? data[0] : null
    const body = withHeaderRow ? data.slice(1) : data

    const MAX_ROWS = 100
    const MAX_COLS = 30
    const rows = (header ? [header, ...body] : body).slice(0, MAX_ROWS).map((r) => r.slice(0, MAX_COLS))

    const rowNodes = rows.map((row, rIdx) => {
      const cells = row.map((cellText) => {
        const cellType = withHeaderRow && rIdx === 0 ? schema.nodes.tableHeader : schema.nodes.tableCell
        return cellType.createAndFill(
          {},
          schema.nodes.paragraph.createAndFill({}, schema.text(String(cellText ?? ""))),
        )!
      })
      return schema.nodes.tableRow.createChecked(null, cells)
    })

    const tableNode = schema.nodes.table.createChecked(null, rowNodes)
    editor.chain().focus().insertContent(tableNode.toJSON()).run()
  }

  // -------- Supabase team logos --------
  const fetchTeamLogos = async () => {
    setLoadingLogos(true)
    try {
      const { data: files, error } = await supabase.storage.from("media").list("team-logos", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      })
      if (error) {
        toast({ title: "Error", description: "Failed to load team logos", variant: "destructive" })
        return
      }
      if (files) {
        const logoFiles = files
          .filter((f) => f.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i))
          .map((file) => {
            const { data: urlData } = supabase.storage.from("media").getPublicUrl(`team-logos/${file.name}`)
            return { name: file.name.replace(/\.[^/.]+$/, ""), url: urlData.publicUrl, path: `team-logos/${file.name}` }
          })
        setTeamLogos(logoFiles)
      }
    } finally {
      setLoadingLogos(false)
    }
  }

  useEffect(() => {
    if (teamLogosDialogOpen && teamLogos.length === 0) fetchTeamLogos()
  }, [teamLogosDialogOpen])

  if (!editor) return null

  // -------- Toolbar handlers --------
  const addLink = () => {
    if (!linkUrl) return
    const url = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    setLinkUrl("")
    setLinkDialogOpen(false)
  }

  const addImage = () => {
    if (!imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl("")
    setImageDialogOpen(false)
  }

  const insertTeamLogo = (logo: TeamLogo) => {
    editor.chain().focus().setImage({ src: logo.url, alt: logo.name, title: logo.name }).run()
    setTimeout(() => {
      const images = editor.view.dom.querySelectorAll(`img[src="${logo.url}"]`)
      const lastImage = images[images.length - 1] as HTMLImageElement | undefined
      if (lastImage) {
        lastImage.style.height = "2rem"
        lastImage.style.width = "auto"
        lastImage.style.display = "inline"
        lastImage.style.verticalAlign = "middle"
        lastImage.style.margin = "0 0.25rem"
      }
    }, 100)
    setTeamLogosDialogOpen(false)
  }

  const setTextColor = (color: string) => editor.chain().focus().setColor(color).run()
  const removeTextColor = () => editor.chain().focus().unsetColor().run()

  const addVideo = () => {
    if (!videoUrl) return
    const url = videoUrl.trim()
    const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url)
    if (isYouTube) {
      editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run()
    } else {
      editor.chain().focus().setVideo({ src: url }).run()
    }
    setVideoUrl("")
    setVideoDialogOpen(false)
  }

  const insertCsv = () => {
    try {
      const data = parseCsvToArray(csvText)
      if (!data.length) {
        toast({ title: "CSV is empty", description: "Paste CSV text or upload a .csv file.", variant: "destructive" })
        return
      }
      insertArrayAsTable(data, csvHasHeader)
      setCsvDialogOpen(false)
      setCsvText("")
    } catch (e: any) {
      toast({ title: "CSV import failed", description: e?.message ?? "Invalid CSV", variant: "destructive" })
    }
  }

  const onCsvFile = async (file?: File) => {
    if (!file) return
    const text = await file.text()
    setCsvText(text)
  }

  // font-size helpers (TextStyle)
  const setFontSize = (size: string | null) => {
    editor
      .chain()
      .focus()
      .setMark("textStyle", size ? { fontSize: size } : { fontSize: null as any })
      .run()
  }

  // font-family helpers
  const setFont = (family: string | null) => {
    editor.chain().focus().setFontFamily(family).run()
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
                  onMouseDown={keepSelection}
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
                  onMouseDown={keepSelection}
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
                  onMouseDown={keepSelection}
                  onPressedChange={() => editor.chain().focus().toggleCode().run()}
                  aria-label="Code"
                >
                  <Code className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Code</TooltipContent>
            </Tooltip>

            {/* Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" type="button" onMouseDown={keepSelection}>
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
                        type="button"
                        onMouseDown={keepSelection}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                        onClick={() => setTextColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onMouseDown={keepSelection}
                    onClick={removeTextColor}
                    className="w-full bg-transparent"
                  >
                    Remove Color
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Headings + Paragraph */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("heading", { level: 1 })}
                  onMouseDown={keepSelection}
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
                  onMouseDown={keepSelection}
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
                  onMouseDown={keepSelection}
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
                  onMouseDown={keepSelection}
                  onPressedChange={() => editor.chain().focus().setParagraph().run()}
                  aria-label="Paragraph"
                >
                  <Pilcrow className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Paragraph</TooltipContent>
            </Tooltip>
          </div>

          {/* Align */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              type="button"
              onMouseDown={keepSelection}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              type="button"
              onMouseDown={keepSelection}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              type="button"
              onMouseDown={keepSelection}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              type="button"
              onMouseDown={keepSelection}
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            >
              <StretchHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists / Quote / HR */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("bulletList")}
                  onMouseDown={keepSelection}
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
                  onMouseDown={keepSelection}
                  onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                  aria-label="Ordered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Ordered List</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("blockquote")}
                  onMouseDown={keepSelection}
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
                  onMouseDown={keepSelection}
                  onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
                  aria-label="Horizontal Rule"
                >
                  <Minus className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Horizontal Rule</TooltipContent>
            </Tooltip>
          </div>

          {/* Fonts / Size */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  type="button"
                  onMouseDown={keepSelection}
                  onClick={() => setFont('"Oswald", Arial, Helvetica, sans-serif')}
                >
                  <Type className="h-4 w-4 mr-1" /> Oswald
                </Button>
              </TooltipTrigger>
              <TooltipContent>Set Font: Oswald</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  type="button"
                  onMouseDown={keepSelection}
                  onClick={() => setFont(null)}
                >
                  <Type className="h-4 w-4 mr-1" /> Default
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear Font</TooltipContent>
            </Tooltip>

            {/* Simple font size presets */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  type="button"
                  onMouseDown={keepSelection}
                  onClick={() => setFontSize("14px")}
                >
                  14
                </Button>
              </TooltipTrigger>
              <TooltipContent>Font size 14px</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  type="button"
                  onMouseDown={keepSelection}
                  onClick={() => setFontSize("16px")}
                >
                  16
                </Button>
              </TooltipTrigger>
              <TooltipContent>Font size 16px</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  type="button"
                  onMouseDown={keepSelection}
                  onClick={() => setFontSize("20px")}
                >
                  20
                </Button>
              </TooltipTrigger>
              <TooltipContent>Font size 20px</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  type="button"
                  onMouseDown={keepSelection}
                  onClick={() => setFontSize("24px")}
                >
                  24
                </Button>
              </TooltipTrigger>
              <TooltipContent>Font size 24px</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  type="button"
                  onMouseDown={keepSelection}
                  onClick={() => setFontSize(null)}
                >
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset font size</TooltipContent>
            </Tooltip>
          </div>

          {/* Media / Links / Team Logos / CSV */}
          <div className="flex items-center border-r pr-1 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("link")}
                  onMouseDown={keepSelection}
                  onPressedChange={() => {
                    if (editor.isActive("link")) editor.chain().focus().unsetLink().run()
                    else setLinkDialogOpen(true)
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
                <Toggle
                  size="sm"
                  onMouseDown={keepSelection}
                  onPressedChange={() => setImageDialogOpen(true)}
                  aria-label="Image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  onMouseDown={keepSelection}
                  onPressedChange={() => setVideoDialogOpen(true)}
                  aria-label="Video"
                >
                  <VideoIcon className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Video</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  onMouseDown={keepSelection}
                  onPressedChange={() => setTeamLogosDialogOpen(true)}
                  aria-label="Team Logos"
                >
                  <Shield className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Team Logos</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  onMouseDown={keepSelection}
                  onPressedChange={() => setCsvDialogOpen(true)}
                  aria-label="CSV to Table"
                >
                  <TableIcon className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Insert Table from CSV</TooltipContent>
            </Tooltip>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  onMouseDown={keepSelection}
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
                  onMouseDown={keepSelection}
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

      {/* Editor surface */}
      <EditorContent editor={editor} />

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
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button onClick={addLink} type="button">
              Add Link
            </Button>
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
            <Button variant="outline" onClick={() => setImageDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button onClick={addImage} type="button">
              Add Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add Video (YouTube or MP4/WebM)</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              Paste a YouTube URL or a direct video URL (mp4/webm/ogg)
            </div>
            <Input
              placeholder="https://youtu.be/VIDEO  or  https://cdn.example.com/video.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addVideo()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button onClick={addVideo} type="button">
              Add Video
            </Button>
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
                    type="button"
                    onMouseDown={keepSelection}
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
            <Button variant="outline" onClick={() => setTeamLogosDialogOpen(false)} type="button">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV → Table Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Insert Table from CSV</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input type="file" accept=".csv,text/csv" onChange={(e) => onCsvFile(e.target.files?.[0] ?? undefined)} />
            </div>
            <textarea
              className="w-full h-48 rounded border p-2 text-sm"
              placeholder={`Paste CSV here, e.g.\nTeam,GP,W,L\nToronto,10,7,3\nBuffalo,10,5,5`}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={csvHasHeader} onChange={(e) => setCsvHasHeader(e.target.checked)} />
              First row is a header
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button onClick={insertCsv} type="button">
              Insert Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { RichTextEditor }
