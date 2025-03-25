import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input, InputProps } from "@/components/ui/input"

export interface SearchInputProps extends InputProps {
  onSearch?: (value: string) => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch((e.target as HTMLInputElement).value)
      }
    }

    return (
      <div className="relative">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          className={cn("pr-10 placeholder:text-right", className)}
          ref={ref}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
