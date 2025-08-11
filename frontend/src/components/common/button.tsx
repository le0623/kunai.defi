import { Button as ButtonUI } from "../ui/button"
import { cn } from "@/lib/utils"

const Button = ({ children, className, variant = 'default', ...props }: React.ComponentProps<typeof ButtonUI>) => {
  return (
    variant === 'default' ? (
      <ButtonUI {...props}
        className={cn("cursor-pointer bg-secondary hover:bg-secondary/70 text-white", className)}>
        {children}
      </ButtonUI>
    ) : (
      <ButtonUI {...props}
        className={cn("cursor-pointer bg-secondary hover:bg-secondary/70 text-white", className)}>
        {children}
      </ButtonUI>
    )
  )
}

export default Button