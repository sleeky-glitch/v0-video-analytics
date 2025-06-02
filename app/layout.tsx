import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar" // [^2]
import { AppSidebar } from "@/components/app-sidebar" // New sidebar component
import { cookies } from "next/headers" // [^2]

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BeyonData Video Analytics",
  description: "Advanced Video Analytics Dashboard by BeyonData",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = cookies() // [^2]
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true" // [^2]

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider defaultOpen={defaultOpen}>
            {" "}
            {/* [^2] */}
            <div className="flex min-h-screen">
              <AppSidebar /> {/* Our new sidebar */}
              <main className="flex-1 flex flex-col">
                {/* Minimal header for sidebar trigger */}
                <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
                  <SidebarTrigger variant="ghost" size="icon" className="md:hidden h-7 w-7">
                    {/* The SidebarTrigger component from shadcn/ui already includes
                        a PanelLeft icon and the sr-only text by default.
                        We are applying variant, size, and className directly.
                        The default size for SidebarTrigger's button is h-7 w-7.
                    */}
                  </SidebarTrigger>
                  <h1 className="text-xl font-semibold ml-2 hidden md:block">BeyonData Video Analytics</h1>
                </header>
                {children}
              </main>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
