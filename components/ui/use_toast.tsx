"use client"

import type React from "react"

import { useState } from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 200000

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
}

type ActionType = (typeof actionTypes)[keyof typeof actionTypes]

type State = {
  toasts: ToasterToast[]
}

type Action = {
  type: ActionType
  toast: ToasterToast
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

let count = 0

function genId(): string {
  count = (count + 1) % Number.MAX_VALUE
  return String(count)
}

export function useToast() {
  const [toasts, setToasts] = useState<ToasterToast[]>([])

  const addToast = (toast: Omit<ToasterToast, "id">) => {
    const id = genId()

    const toastProps: ToasterToast = {
      ...toast,
      id: id,
    }

    setToasts((prevState) => [toastProps, ...prevState].slice(0, TOAST_LIMIT))

    if (toast.duration !== null && toast.duration !== 0) {
      toastTimeouts.set(
        id,
        setTimeout(() => {
          dismiss(id)
        }, toast.duration || TOAST_REMOVE_DELAY),
      )
    }

    return id
  }

  const updateToast = (toast: Partial<ToasterToast> & { id: string }) => {
    setToasts((prevState) => prevState.map((t) => (t.id === toast.id ? { ...t, ...toast } : t)))
  }

  const dismiss = (toastId?: string) => {
    if (toastId) {
      clearTimeout(toastTimeouts.get(toastId))
      toastTimeouts.delete(toastId)

      setToasts((prevState) => prevState.map((t) => (t.id === toastId ? { ...t, open: false } : t)))
    } else {
      setToasts((prevState) => {
        prevState.forEach((t) => dismiss(t.id))
        return []
      })
    }
  }

  const remove = (toastId: string) => {
    clearTimeout(toastTimeouts.get(toastId))
    setToasts((prevState) => prevState.filter((t) => t.id !== toastId))
  }

  return {
    toasts,
    toast: ({ ...props }) => {
      const id = addToast(props)
      return {
        dismiss: () => dismiss(id),
        update: (options) => updateToast({ id: id, ...options }),
      }
    },
    dismiss,
    remove,
  }
}
