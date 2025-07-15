import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { useState } from "react"

export interface SearchBoxProps extends React.ComponentProps<typeof Input> {
  debounceMs?: number
}

const SearchBox = React.forwardRef<HTMLInputElement, SearchBoxProps>(
  ({
    className,
    debounceMs = 300,
    ...props
  }, ref) => {
    const [value, setValue] = React.useState("")
    const [debouncedValue, setDebouncedValue] = React.useState("")
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const [searchResults, setSearchResults] = useState<string[]>([])

    const handleSearch = (value: string) => {
      console.log('Advanced search:', value)

      // Simulate API call
      setTimeout(() => {
        if (value) {
          setSearchResults([
            `Advanced result for: ${value}`,
            `Another result for: ${value}`,
            `Third result for: ${value}`
          ])
        } else {
          setSearchResults([])
        }
      }, 1000)
    }

    const handleClear = () => {
      setValue("")
      setDebouncedValue("")
      setSearchResults([])
      console.log('Search cleared')
    }

    // Debounce the search
    React.useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value)
      }, 300)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [value])

    // Trigger search when debounced value changes
    React.useEffect(() => {
      handleSearch(debouncedValue)
    }, [debouncedValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        // Don't call onSearch here since it's already called via debounced effect
        e.preventDefault()
      }
      if (e.key === "Escape") {
        handleClear()
      }
    }

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-10 w-full rounded-md border-none bg-transparent pl-9 pr-9 py-1 text-sm shadow-sm transition-colors",
            "file:text-foreground placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />

        {/* Clear button */}
        {value && (
          <X className="h-4 w-4 p-0.5 absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-500 cursor-pointer" onClick={handleClear} />
        )}
      </div>
    )
  }
)

SearchBox.displayName = "SearchBox"

export { SearchBox } 