import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DebugDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  data: any
}

export function DebugDialog({ open, onOpenChange, title, description, data }: DebugDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="mt-4">
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
