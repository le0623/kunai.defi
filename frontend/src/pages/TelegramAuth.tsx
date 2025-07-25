import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { authAPI } from '@/services/api'
import { useAuth } from '@/store/hooks'
import { toast } from 'sonner'

const TelegramAuth = () => {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code');
  const user_id = searchParams.get('user_id');
  const refCode = searchParams.get('refCode');

  console.log(code, user_id, refCode)

  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyTelegramLogin = async () => {
      if (code && user_id) {
        console.log(code, user_id, refCode)
        const response = await authAPI.verifyTelegramLogin(user_id, code, refCode)
        console.log(response)
        if (response.success) {
          login(response.token)
        } else {
          toast.error(response.message)
        }
        navigate('/')
      }
    }
    verifyTelegramLogin()
  }, [code, user_id, refCode])

  return (
    <div className="flex justify-center items-center h-full">
      <div className="loader">
        <div className="orbe" style={{ '--index': 0 } as React.CSSProperties}></div>
        <div className="orbe" style={{ '--index': 1 } as React.CSSProperties}></div>
        <div className="orbe" style={{ '--index': 2 } as React.CSSProperties}></div>
        <div className="orbe" style={{ '--index': 3 } as React.CSSProperties}></div>
        <div className="orbe" style={{ '--index': 4 } as React.CSSProperties}></div>
      </div>
    </div>
  )
}

export default TelegramAuth 