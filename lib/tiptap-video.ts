import { Node, mergeAttributes } from "@tiptap/core"

export interface VideoAttrs {
  src: string
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  poster?: string
  playsinline?: boolean
  width?: number | string | null
  height?: number | string | null
  class?: string | null
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (attrs: VideoAttrs) => ReturnType
    }
  }
}

const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      autoplay: { default: false },
      loop: { default: false },
      muted: { default: false },
      poster: { default: null },
      playsinline: { default: true },
      width: { default: null },
      height: { default: null },
      class: { default: "rounded-md w-full max-w-full h-auto my-4" },
    }
  },

  parseHTML() {
    return [{ tag: "video" }]
  },

  renderHTML({ HTMLAttributes }) {
    const { src, ...rest } = HTMLAttributes as any
    return [
      "video",
      mergeAttributes({ controls: true, playsinline: true }, rest),
      ["source", { src }],
    ]
  },

  addCommands() {
    return {
      setVideo:
        (attrs: VideoAttrs) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run(),
    }
  },
})

export default Video
