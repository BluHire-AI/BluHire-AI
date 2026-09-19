"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon, Search } from "lucide-react"

const SelectContext = React.createContext<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchable: boolean;
  itemMap: Map<any, React.ReactNode>;
  getLabel: (val: any) => React.ReactNode | undefined;
} | null>(null);

function extractItemMap(node: React.ReactNode, map = new Map<any, React.ReactNode>()): Map<any, React.ReactNode> {
  if (!node) return map;
  if (Array.isArray(node)) {
    node.forEach(child => extractItemMap(child, map));
    return map;
  }
  if (React.isValidElement(node)) {
    const props = node.props as any;
    if (props && 'value' in props && props.value !== undefined) {
      let label = props.label;
      if (!label && props.children) {
        if (typeof props.children === 'string' || typeof props.children === 'number') {
          label = props.children;
        } else if (Array.isArray(props.children)) {
          const textParts = props.children
            .map((c: any) => (typeof c === 'string' || typeof c === 'number' ? c : ''))
            .join('');
          label = textParts || props.children;
        } else {
          label = props.children;
        }
      }
      map.set(props.value, label !== undefined && label !== null ? label : props.value);
    }
    if (props && props.children) {
      extractItemMap(props.children, map);
    }
  }
  return map;
}

function Select({
  searchable = false,
  items: itemsProp,
  children,
  open,
  onOpenChange,
  ...props
}: SelectPrimitive.Root.Props<any> & {
  searchable?: boolean;
  items?: Array<{ value: any; label: any }> | any[];
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [internalOpen, setInternalOpen] = React.useState(false);

  const itemMap = React.useMemo(() => {
    const map = extractItemMap(children);
    if (Array.isArray(itemsProp)) {
      itemsProp.forEach((it) => {
        if (it && typeof it === 'object' && 'value' in it) {
          map.set(it.value, it.label ?? it.value);
        }
      });
    }
    return map;
  }, [children, itemsProp]);

  const mergedItems = React.useMemo(() => {
    if (itemsProp) return itemsProp;
    const itemsArr: Array<{ value: any; label: React.ReactNode }> = [];
    itemMap.forEach((label, value) => {
      itemsArr.push({ value, label });
    });
    return itemsArr.length > 0 ? itemsArr : undefined;
  }, [itemsProp, itemMap]);

  const getLabel = React.useCallback((val: any) => {
    if (val === undefined || val === null || val === '') return undefined;
    return itemMap.get(val);
  }, [itemMap]);

  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = (nextOpen: boolean, eventDetails: any) => {
    if (!nextOpen) {
      setSearchQuery("");
    }
    onOpenChange?.(nextOpen, eventDetails);
    setInternalOpen(nextOpen);
  };

  return (
    <SelectContext.Provider value={{ searchQuery, setSearchQuery, isSearchable: searchable, itemMap, getLabel }}>
      <SelectPrimitive.Root open={isOpen} onOpenChange={handleOpenChange} items={mergedItems} {...props}>
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  className,
  placeholder,
  children,
  ...props
}: SelectPrimitive.Value.Props) {
  const ctx = React.useContext(SelectContext);

  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left truncate", className)}
      placeholder={placeholder}
      {...props}
    >
      {(val) => {
        if (typeof children === 'function') {
          return children(val);
        }
        if (children) {
          return children;
        }
        if (val === undefined || val === null || val === '') {
          return placeholder;
        }
        const resolved = ctx?.getLabel(val);
        if (resolved !== undefined && resolved !== null) {
          return resolved;
        }
        // If value is a 24-character hex MongoDB ObjectId that is not yet in lookup data:
        // Do not display raw ObjectId to the user; fallback to placeholder or friendly text
        if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
          return placeholder || 'Loading...';
        }
        return val;
      }}
    </SelectPrimitive.Value>
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-1.5 rounded-xl border border-border dark:border-white/5 bg-card dark:bg-white/5 py-2 px-3.5 text-sm text-foreground dark:text-zinc-200 whitespace-nowrap transition-all duration-200 outline-none select-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:data-placeholder:text-zinc-500 data-[size=default]:h-10 data-[size=sm]:h-8 data-[size=sm]:rounded-lg *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 shadow-xs",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground dark:text-zinc-455 transition-transform duration-200" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  const context = React.useContext(SelectContext);
  const isSearchable = context?.isSearchable ?? false;
  const searchQuery = context?.searchQuery ?? "";
  const setSearchQuery = context?.setSearchQuery;

  // Simple and robust text-matching filtering for children
  const filteredChildren = React.useMemo(() => {
    if (!isSearchable || !searchQuery) return children;

    const query = searchQuery.toLowerCase();

    // Helper to get text recursively from a React element
    const getElementText = (element: React.ReactElement): string => {
      let text = "";
      const elProps = element.props as any;
      React.Children.forEach(elProps?.children, (child) => {
        if (typeof child === "string" || typeof child === "number") {
          text += child;
        } else if (React.isValidElement(child)) {
          text += getElementText(child);
        }
      });
      return text;
    };

    // Helper to filter a node
    const filterNode = (node: React.ReactNode): React.ReactNode => {
      if (!node) return null;

      if (Array.isArray(node)) {
        const filtered = node.map(filterNode).filter(Boolean);
        return filtered.length > 0 ? filtered : null;
      }

      if (React.isValidElement(node)) {
        const props = node.props as any;
        const slot = props?.["data-slot"];
        const componentName = (node.type as any)?.name;

        // If it's a SelectItem
        if (slot === "select-item" || componentName === "SelectItem") {
          const text = getElementText(node);
          if (text.toLowerCase().includes(query)) {
            return node;
          }
          return null;
        }

        // If it has children (like SelectGroup or SelectPrimitive.List)
        if (props?.children) {
          const filteredChildren = filterNode(props.children);
          if (filteredChildren) {
            return React.cloneElement(node, {}, filteredChildren);
          }
          return null;
        }
      }

      return node;
    };

    return React.Children.map(children, filterNode);
  }, [children, isSearchable, searchQuery]);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-44 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl bg-popover dark:bg-zinc-950/95 border border-border dark:border-white/10 shadow-2xl backdrop-blur-xl p-1.5 text-popover-foreground dark:text-zinc-200 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {isSearchable && (
            <div className="flex items-center gap-2 px-2.5 pb-2 pt-1 border-b border-border dark:border-white/5 sticky top-0 bg-popover dark:bg-zinc-950/95 backdrop-blur-xl z-20">
              <Search className="size-3.5 text-muted-foreground dark:text-zinc-500 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                className="w-full bg-transparent text-xs text-foreground dark:text-zinc-200 outline-none border-none placeholder:text-muted-foreground p-0 focus:ring-0 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
              />
            </div>
          )}
          <SelectScrollUpButton />
          <SelectPrimitive.List className="space-y-0.5">{filteredChildren}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  label: labelProp,
  ...props
}: SelectPrimitive.Item.Props & {
  label?: string;
}) {
  const computedLabel = React.useMemo(() => {
    if (labelProp) return labelProp;
    if (typeof children === 'string' || typeof children === 'number') {
      return String(children);
    }
    if (Array.isArray(children)) {
      const text = children
        .map((c) => (typeof c === 'string' || typeof c === 'number' ? c : ''))
        .join('');
      if (text) return text;
    }
    return undefined;
  }, [labelProp, children]);

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      label={computedLabel}
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-2 rounded-lg py-2 pr-8 pl-3 text-xs md:text-sm text-foreground dark:text-zinc-300 outline-hidden select-none transition-all duration-150 data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground focus:bg-primary focus:text-primary-foreground hover:bg-primary hover:text-primary-foreground data-[selected]:bg-primary/10 dark:data-[selected]:bg-primary/20 data-[selected]:text-primary dark:data-[selected]:text-white data-[selected]:font-semibold data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none text-primary dark:text-white" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
