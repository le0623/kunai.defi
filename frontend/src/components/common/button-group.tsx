import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

const ButtonGroup = ({ buttons, className, selectedButtons }: { buttons: { id: string, component: React.ReactNode, onClick: () => void }[], className?: string, selectedButtons?: string[] }) => {
  return (
    <div className="flex">
      {buttons.map((button, index) => (
        <Button
          key={button.id}
          variant="defaultOutline"
          className={cn(
            className,
            // Remove default rounded corners
            "rounded-none",
            // First button: left rounded corners and full borders
            index === 0 && "rounded-l-md border",
            // Last button: right rounded corners
            index === buttons.length - 1 && "rounded-r-md",
            // All buttons except first: no left border
            index > 0 && "border-l-0",
            // Selected state
            selectedButtons?.includes(button.id) && "bg-white/10"
          )}
          onClick={button.onClick}
        >
          {button.component}
        </Button>
      ))}
    </div>
  )
}

export default ButtonGroup