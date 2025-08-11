import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const DebugRouter = () => {
  const location = useLocation()

  useEffect(() => {
    console.log('🔍 Route changed:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      fullPath: location.pathname + location.search + location.hash,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    })

    // Check if the page is blank
    setTimeout(() => {
      const rootElement = document.getElementById('root')
      if (rootElement && rootElement.children.length === 0) {
        console.error('🚨 Blank page detected! Root element has no children')
      }
    }, 100)
  }, [location])

  return null
}

export default DebugRouter 