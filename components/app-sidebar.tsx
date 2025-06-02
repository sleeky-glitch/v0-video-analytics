"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar, // [^2]
} from "@/components/ui/sidebar" // [^2]
import { Separator } from "@/components/ui/separator"
import { Flame, AlertTriangle, ShieldAlert, Bell, Settings, LifeBuoy, LogOut } from "lucide-react"
import type { Camera } from "@/types/camera"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { usePathname } from "next/navigation" // To highlight active link

// Dummy hook for now, replace with actual data fetching or context
const useAlerts = (cameras: Camera[]) => {
  const fireAlerts = cameras.filter(
    (cam) =>
      cam.isActive &&
      cam.lastAnalysis?.modelUsed === "fire_detection" &&
      (cam.lastAnalysis.fireDetections?.length || 0) > 0,
  )
  const personInAreaAlerts = cameras.filter(
    (cam) =>
      cam.isActive &&
      cam.lastAnalysis?.modelUsed === "person_detection_in_area" &&
      cam.lastAnalysis.personInDesignatedArea,
  )
  return { fireAlerts, personInAreaAlerts }
}

interface AppSidebarProps {
  cameras?: Camera[] // Make cameras optional for now, will be passed from page
}

export function AppSidebar({ cameras = [] }: AppSidebarProps) {
  const { fireAlerts, personInAreaAlerts } = useAlerts(cameras)
  const { state: sidebarState } = useSidebar() // [^2]
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Dashboard", icon: Bell }, // Assuming dashboard is at root
    // Add more navigation items here if needed
  ]

  const alertItems = [
    ...fireAlerts.map((cam) => ({
      id: `fire-${cam.id}`,
      type: "Fire Detected" as const,
      cameraName: cam.name,
      timestamp: cam.lastAnalysis?.timestamp || Date.now(),
      icon: Flame,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    })),
    ...personInAreaAlerts.map((cam) => ({
      id: `area-${cam.id}`,
      type: "Person in Area" as const,
      cameraName: cam.name,
      timestamp: cam.lastAnalysis?.timestamp || Date.now(),
      icon: AlertTriangle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    })),
  ].sort((a, b) => b.timestamp - a.timestamp) // Sort newest first

  return (
    <Sidebar
      className="border-r dark:bg-zinc-900" // Custom dark background for sidebar
      collapsible="icon" // [^2]
      variant="sidebar" // [^2]
    >
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-beyondata.png" alt="BeyonData Logo" width={32} height={32} className="rounded-sm" />
          {sidebarState === "expanded" && <span className="text-lg font-semibold whitespace-nowrap">BeyonData</span>}
        </Link>
      </SidebarHeader>
      <Separator />
      <SidebarContent className="p-0">
        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={sidebarState === "collapsed" ? item.label : undefined}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="flex items-center">
            <ShieldAlert className="mr-2 h-4 w-4" />
            Active Alerts
            {alertItems.length > 0 && sidebarState === "expanded" && (
              <Badge variant="destructive" className="ml-auto">
                {alertItems.length}
              </Badge>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {alertItems.length === 0 ? (
              <div className={`p-2 text-sm text-muted-foreground ${sidebarState === "collapsed" ? "text-center" : ""}`}>
                {sidebarState === "expanded" ? "No active alerts." : <Bell className="h-5 w-5 mx-auto" />}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh_-_400px)]">
                {" "}
                {/* Adjust height as needed */}
                <SidebarMenu>
                  {alertItems.slice(0, 10).map(
                    (
                      alert, // Show max 10 alerts
                    ) => (
                      <SidebarMenuItem key={alert.id} className={`rounded-md p-1 ${alert.bgColor}`}>
                        <SidebarMenuButton
                          className={`h-auto p-1.5 ${alert.color} hover:${alert.bgColor} data-[active=true]:${alert.bgColor}`}
                          tooltip={sidebarState === "collapsed" ? `${alert.type} on ${alert.cameraName}` : undefined}
                        >
                          <alert.icon className={`h-4 w-4 shrink-0 ${alert.color}`} />
                          {sidebarState === "expanded" && (
                            <div className="flex flex-col text-xs">
                              <span className="font-medium">{alert.type}</span>
                              <span className="text-muted-foreground">{alert.cameraName}</span>
                              <span className="text-muted-foreground text-[10px]">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ),
                  )}
                </SidebarMenu>
              </ScrollArea>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={sidebarState === "collapsed" ? "Settings" : undefined}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={sidebarState === "collapsed" ? "Support" : undefined}>
              <LifeBuoy className="h-4 w-4" />
              <span>Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={sidebarState === "collapsed" ? "Logout" : undefined}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
