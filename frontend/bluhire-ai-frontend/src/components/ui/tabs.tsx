import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{ value?: string; setValue: (val: string) => void } | null>(null)

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value: controlledValue, onValueChange, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(defaultValue)
    
    const isControlled = controlledValue !== undefined
    const activeValue = isControlled ? controlledValue : localValue

    const setValue = React.useCallback((newValue: string) => {
      if (!isControlled) {
        setLocalValue(newValue)
      }
      if (onValueChange) {
        onValueChange(newValue)
      }
    }, [isControlled, onValueChange])

    return (
      <TabsContext.Provider value={{ value: activeValue, setValue }}>
        <div ref={ref} className={cn("w-full", className)} {...props} />
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-9 items-center justify-start rounded-lg bg-zinc-100 p-1 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/80",
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsTrigger must be used within Tabs")
    const isActive = context.value === value
    return (
      <button
        type="button"
        ref={ref}
        onClick={() => context.setValue(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none cursor-pointer disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
            : "hover:bg-zinc-200/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsContent must be used within Tabs")
    if (context.value !== value) return null
    return (
      <div
        ref={ref}
        className={cn(
          "mt-4 focus-visible:outline-none",
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
