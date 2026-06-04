import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{
  open?: boolean
  setOpen: (open: boolean) => void
} | null>(null)

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps) {
  const [localOpen, setLocalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : localOpen

  const setOpen = React.useCallback((val: boolean) => {
    if (!isControlled) {
      setLocalOpen(val)
    }
    if (onOpenChange) {
      onOpenChange(val)
    }
  }, [isControlled, onOpenChange])

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger must be used within Dialog")

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick: (e: any) => {
        const childProps = children.props as any
        childProps.onClick?.(e)
        context.setOpen(true)
      }
    })
  }

  return (
    <div onClick={() => context.setOpen(true)} className="inline-block cursor-pointer">
      {children}
    </div>
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function DialogContent({ children, className, ...props }: DialogContentProps) {
  const context = React.useContext(DialogContext)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!context || !context.open || !mounted) return null

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={() => context.setOpen(false)}
      />
      {/* Content Box */}
      <div 
        className={cn(
          "relative z-50 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
          className
        )}
        {...props}
      >
        {children}
        <button
          onClick={() => context.setOpen(false)}
          className="absolute right-4 top-4 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none dark:hover:bg-zinc-900 cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 mt-6", className)} {...props} />
  )
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-zinc-500 dark:text-zinc-400 mt-1.5", className)} {...props} />
  )
}

interface DialogCloseProps {
  children: React.ReactNode
  asChild?: boolean
}

function DialogClose({ children, asChild }: DialogCloseProps) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogClose must be used within Dialog")

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick: (e: any) => {
        const childProps = children.props as any
        childProps.onClick?.(e)
        context.setOpen(false)
      }
    })
  }

  return (
    <div onClick={() => context.setOpen(false)} className="inline-block">
      {children}
    </div>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
