
import { Home, Library, User, BookMarked, History } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader,
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarSeparator 
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks"

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  const isActive = (path: string) => location.pathname === path

  const mainMenu = [
    {
      title: "Home",
      icon: Home,
      path: "/",
    },
    {
      title: "Movies",
      icon: Library,
      path: "/movies",
    },
    {
      title: "TV Shows",
      icon: BookMarked,
      path: "/tv",
    }
  ]
  
  const userMenu = user ? [
    {
      title: "Profile",
      icon: User,
      path: "/profile",
    },
    {
      title: "Watch History",
      icon: History,
      path: "/watch-history",
    }
  ] : []

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="py-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="sidebar-card-icon">
              <span className="text-sm font-bold">M</span>
            </div>
            <span className="text-lg font-semibold text-white">MovieFlix</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {userMenu.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        isActive={isActive(item.path)}
                        tooltip={item.title}
                        onClick={() => navigate(item.path)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="py-3">
        <div className="px-2">
          <div className="sidebar-card">
            <div className="flex items-center gap-2 p-2">
              {user ? (
                <>
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white">
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.displayName || user.email}</span>
                    <span className="text-xs text-white/60">Premium</span>
                  </div>
                </>
              ) : (
                <button 
                  className="w-full rounded-md bg-gradient-to-r from-accent to-purple-500 py-2 text-sm font-medium text-white"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
