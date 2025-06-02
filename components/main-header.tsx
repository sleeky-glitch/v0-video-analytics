"use client"
import { SidebarTrigger } from "@/components/ui/sidebar" // [^2]
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, PanelLeft, UserCircle, Settings, LogOut } from "lucide-react"

export function MainHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-brand-header px-4 sm:h-16 sm:px-6">
      <SidebarTrigger
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 text-brand-header-text hover:bg-white/20"
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </SidebarTrigger>

      <div className="flex-1">{/* Placeholder for breadcrumbs or search if needed */}</div>

      <div className="flex items-center gap-3">
        {/* Date Range Picker Placeholder - You'll need to implement or install a date range picker */}
        <Button
          variant="outline"
          className="gap-1 text-sm hidden sm:flex bg-white/10 text-brand-header-text border-white/30 hover:bg-white/20"
        >
          <CalendarDays className="h-4 w-4" />
          <span>Start Date - End Date</span>
        </Button>
        {/* <DateRangePicker
          align="end"
          className="hidden sm:flex"
          triggerClassName="bg-white/10 text-brand-header-text border-white/30 hover:bg-white/20"
        /> */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-white/20">
              <Avatar className="h-9 w-9 border-2 border-white/30">
                <AvatarImage src="/diverse-user-avatars.png" alt="User Avatar" />
                <AvatarFallback className="bg-brand-primary-blue text-white">JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs leading-none text-muted-foreground">Admin</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
