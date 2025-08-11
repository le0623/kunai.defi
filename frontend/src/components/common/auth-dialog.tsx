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
import { ArrowLeftIcon, ArrowRight, Icon, Wallet2Icon, WalletIcon } from "lucide-react";
import { useState } from "react"
import Input from "@/components/common/input"
import { authAPI } from "@/services/api"
import { toast } from "sonner"
import { InputOTP, InputOTPSeparator, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

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
            {isVerificationSent ? 
              <div className="flex items-center gap-2">
                <ArrowLeftIcon className="size-4" onClick={goBackToEmail} />
                Verify Your Email
              </div>
              :
              isSignUp ? 'Sign Up' : 'Sign In'}
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
                    <span
                      onClick={toggleView}
                      className="cursor-pointer text-white underline"
                    >
                      Sign in
                    </span>
                  </>
                ) : (
                  <>
                    Don't have an account yet?{' '}
                    <span
                      onClick={toggleView}
                      className="cursor-pointer text-white underline"
                    >
                      Sign up
                    </span>
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

              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Button>
            </form>
          ) : (
            // Verification code form
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <div className="flex justify-center my-4">
                <InputOTP
                  maxLength={6}
                  value={formData.verificationCode}
                  onChange={(value) => handleInputChange('verificationCode', value)}
                  pattern="^[0-9]+$"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="size-12 text-lg" />
                    <InputOTPSlot index={1} className="size-12 text-lg" />
                    <InputOTPSlot index={2} className="size-12 text-lg" />
                    <InputOTPSlot index={3} className="size-12 text-lg" />
                    <InputOTPSlot index={4} className="size-12 text-lg" />
                    <InputOTPSlot index={5} className="size-12 text-lg" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-sm text-white"
                >
                  Didn't receive code? Resend
                </Button>
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

          <div className="flex justify-around">
            {/* Telegram Login */}
            <div className="flex flex-col items-center gap-2">
              <Button
                className="size-16 flex justify-center rounded-full"
                onClick={() => {
                  window.open(`https://t.me/KunaiSniper_bot?start=login${formData.inviteCode ? `_refCode=${formData.inviteCode}` : ''}`, '_blank')
                }}
              >
                <img src="/icon/telegram.svg" alt="Telegram" className="size-12" />
              </Button>
              <span className="text-sm text-muted-foreground">Telegram</span>
            </div>

            {/* Wallet Connect */}
            {!isSignUp && (
              <div className="flex flex-col items-center gap-2">
                <Button
                  className="size-16 flex justify-center rounded-full"
                  onClick={handleConnectWallet}
                >
                  <WalletIcon className="size-8" />
                </Button>
                <span className="text-sm text-muted-foreground">Wallet</span>
              </div>
            )}
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