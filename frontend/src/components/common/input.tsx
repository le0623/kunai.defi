import React from "react"
import { Input as InputUI } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<typeof InputUI> & {
  prefixComp?: React.ReactNode
  suffixComp?: React.ReactNode
  topClassName?: string
}

const Input = ({ prefixComp, suffixComp, topClassName, ...props }: InputProps) => {
  return (
    <div className={cn("flex items-center bg-muted rounded-sm justify-between", topClassName)}>
      {prefixComp && (
        <div className="flex items-center bg-inherit text-muted-foreground text-sm">
          {prefixComp}
        </div>
      )}
      <InputUI
        {...props}
        className={cn(
          "bg-inherit border-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 rounded-sm",
          prefixComp && "pl-0",
          suffixComp && "pr-0",
          props.className
        )}
      />
      {suffixComp && (
        <div className="flex items-center bg-inherit text-muted-foreground text-sm">
          {suffixComp}
        </div>
      )}
    </div>
  )
}

export default Input