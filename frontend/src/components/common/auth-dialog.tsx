import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import {
  useConnectModal,
} from '@rainbow-me/rainbowkit';
import { ArrowRight } from "lucide-react";
import { useState } from "react"
import Input from "./input"

const AuthDialog: React.FC = () => {
  const { isAuthDlgOpen, showAuthDlg } = useAuth()
  const { openConnectModal } = useConnectModal()
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    inviteCode: ''
  })

  const handleConnectWallet = () => {
    if (openConnectModal) {
      showAuthDlg(false)
      openConnectModal()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp) {
      // Handle sign up logic
      console.log('Sign up:', formData)
    } else {
      // Handle sign in logic
      console.log('Sign in:', formData)
    }
  }

  const toggleView = () => {
    setIsSignUp(!isSignUp)
    setFormData({
      email: '',
      inviteCode: ''
    })
  }

  return (
    <Dialog open={isAuthDlgOpen} onOpenChange={showAuthDlg}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Sign Up' : 'Sign In'}</DialogTitle>
          <DialogDescription>
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={toggleView}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account yet?{' '}
                <button
                  onClick={toggleView}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            {/* Invite Code */}
            {isSignUp && <div className="space-y-2">
              <label htmlFor="inviteCode" className="text-sm font-medium">
                Invite Code
              </label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="Enter your invite code"
                value={formData.inviteCode}
                onChange={(e) => handleInputChange('inviteCode', e.target.value)}
                required
              />
            </div>}

            <Button type="submit" className="w-full">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* Telegram Login */}
          <div className="flex justify-center">
            <div className="flex items-center gap-1 cursor-pointer">
              Login with Telegram
            </div>
          </div>

          {/* Wallet Connect */}
          <div className="flex justify-center mt-4">
            <div
              onClick={handleConnectWallet}
              className="flex items-center gap-1 cursor-pointer"
            >
              Connect Wallet
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Terms and Privacy */}
          <div className="flex justify-center gap-2 text-xs text-muted-foreground mt-4">
            <a href="https://www.google.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Terms of Service
            </a>
            |
            <a href="https://www.google.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog