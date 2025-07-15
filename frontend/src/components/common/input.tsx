import { Input as InputUI } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const Input = ({ className, ...props }: React.ComponentProps<typeof InputUI>) => {
  return <InputUI {...props} className={cn("bg-background focus-visible:ring-primary focus-visible:ring-1 border-none", className)} />
}

export default Input