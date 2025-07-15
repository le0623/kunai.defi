import Header from "@/components/header"
import Footer from "@/components/footer"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col h-screen w-screen">
      <Header />

      {/* Page Content */}
      <main className="flex-1 bg-background overflow-auto">
        {children}
      </main>

      <Footer />
    </div>
  )
}

export default Layout