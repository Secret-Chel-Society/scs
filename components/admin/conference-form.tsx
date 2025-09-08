"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ColorPicker } from "@/components/ui/color-picker"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import type { Conference, ConferenceFormValues } from "@/lib/types/conferences"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  short_name: z.string().max(10).optional(),
  description: z.string().optional(),
  color: z.string().min(4).max(9).regex(/^#/, "Must be a valid hex color"),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  is_active: z.boolean().default(true),
})

interface ConferenceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conference?: Conference | null
  onSuccess?: () => void
}

export function ConferenceForm({ open, onOpenChange, conference, onSuccess }: ConferenceFormProps) {
  const [loading, setLoading] = useState(false)
  const supabase = useSupabase()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      short_name: "",
      description: "",
      color: "#000000",
      logo_url: "",
      is_active: true,
    },
  })

  // Reset form when conference changes
  useEffect(() => {
    if (conference) {
      form.reset({
        name: conference.name,
        short_name: conference.short_name || "",
        description: conference.description || "",
        color: conference.color || "#000000",
        logo_url: conference.logo_url || "",
        is_active: conference.is_active,
      })
    } else {
      form.reset()
    }
  }, [conference, open])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!supabase) return
    
    setLoading(true)
    try {
      if (conference) {
        // Update existing conference
        const { error } = await supabase
          .from('conferences')
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conference.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Conference updated successfully",
        })
      } else {
        // Create new conference
        const { error } = await supabase
          .from('conferences')
          .insert([values])

        if (error) throw error

        toast({
          title: "Success",
          description: "Conference created successfully",
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error saving conference:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save conference",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {conference ? 'Edit Conference' : 'Create New Conference'}
          </DialogTitle>
          <DialogDescription>
            {conference 
              ? 'Update the conference details below.'
              : 'Fill out the form to create a new conference.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Eastern Conference" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="short_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EAST" {...field} maxLength={10} />
                    </FormControl>
                    <FormDescription>Max 10 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        color={field.value}
                        onChange={field.onChange}
                      />
                      <Input 
                        className="w-24" 
                        {...field} 
                        placeholder="#000000" 
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/logo.png" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional description of the conference" 
                      className="min-h-[100px]" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Inactive conferences won't be available for selection
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {conference ? 'Save Changes' : 'Create Conference'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
