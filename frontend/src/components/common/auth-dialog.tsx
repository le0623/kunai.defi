import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/store/hooks"
import {
  useConnectModal,
} from '@rainbow-me/rainbowkit';
import { ArrowRight } from "lucide-react";
import { useState } from "react"
import Input from "./input"
import { authAPI } from "@/services/api"
import { toast } from "sonner"

const AuthDialog: React.FC = () => {
  const { isAuthDlgOpen, showAuthDlg, login } = useAuth()
  const { openConnectModal } = useConnectModal()
  const [isSignUp, setIsSignUp] = useState(false)
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    inviteCode: '',
    verificationCode: ''
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

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.sendVerificationCode(formData.email)
      
      if (response.success) {
        setIsVerificationSent(true)
        toast.success('Verification code sent to your email')
      } else {
        toast.error(response.message || 'Failed to send verification code')
      }
    } catch (error) {
      console.error('Error sending verification code:', error)
      toast.error('Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.verificationCode) {
      toast.error('Please enter the verification code')
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.verifyEmailCode({
        email: formData.email,
        code: formData.verificationCode,
      })
      
      if (response.success) {
        // Login the user
        login(response.token)
        showAuthDlg(false)
        toast.success(isSignUp ? 'Account created successfully!' : 'Login successful!')
        
        // Reset form
        setFormData({
          email: '',
          inviteCode: '',
          verificationCode: ''
        })
        setIsVerificationSent(false)
      } else {
        toast.error(response.message || 'Verification failed')
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      toast.error('Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      const response = await authAPI.sendVerificationCode(formData.email)
      
      if (response.success) {
        toast.success('New verification code sent')
      } else {
        toast.error(response.message || 'Failed to resend code')
      }
    } catch (error) {
      console.error('Error resending code:', error)
      toast.error('Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleView = () => {
    setIsSignUp(!isSignUp)
    setIsVerificationSent(false)
    setFormData({
      email: '',
      inviteCode: '',
      verificationCode: ''
    })
  }

  const goBackToEmail = () => {
    setIsVerificationSent(false)
    setFormData(prev => ({
      ...prev,
      verificationCode: ''
    }))
  }

  return (
    <Dialog open={isAuthDlgOpen} onOpenChange={showAuthDlg}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isVerificationSent ? 'Verify Your Email' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </DialogTitle>
          <DialogDescription>
            {isVerificationSent ? (
              <>
                We sent a 6-digit code to <strong>{formData.email}</strong>
              </>
            ) : (
              <>
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
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {!isVerificationSent ? (
            // Email input form
            <form onSubmit={handleSendVerification} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Button>
            </form>
          ) : (
            // Verification code form
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={formData.verificationCode}
                  onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goBackToEmail}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-sm text-primary hover:underline"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </form>
          )}

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
            <a
              href={`https://t.me/KunaiSniper_bot?start=login${formData.inviteCode ? `_refCode=${formData.inviteCode}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {/* <img src="/icon/telegram.svg" alt="Telegram" className="w-4 h-4" /> */}
              Login with Telegram
            </a>
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