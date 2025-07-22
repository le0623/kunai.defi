import { Button as ButtonUI } from "../ui/button"
import { cn } from "@/lib/utils"

const Button = ({ children, className, ...props }: React.ComponentProps<typeof ButtonUI>) => {
  return (
    <ButtonUI {...props}
      className={cn("cursor-pointer bg-secondary hover:bg-secondary/70 text-white", className)}>
      {children}
    </ButtonUI>
  )
}

export default Button