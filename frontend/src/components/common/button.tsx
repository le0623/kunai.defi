import { Button as ButtonUI } from "../ui/button"
import { cn } from "@/lib/utils"

const Button = ({ children, className, ...props }: React.ComponentProps<typeof ButtonUI>) => {
  return (
    <ButtonUI {...props}
      className={cn("cursor-pointer bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-colors duration-200 text-white", className)}>
      {children}
    </ButtonUI>
  )
}

export default Button