import { useState } from "react"
import { Check, Copy } from "lucide-react"

const CopyIcon = ({ clipboardText }: { clipboardText?: string | null }) => {
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    try {
      navigator.clipboard.writeText(clipboardText || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  return copied ? (
    <Check className="h-4 w-4" onClick={handleCopyAddress} />
  ) : (
    <Copy className="hover:text-foreground text-muted-foreground w-4 h-4 cursor-pointer" onClick={handleCopyAddress} />
  )
}

export default CopyIcon