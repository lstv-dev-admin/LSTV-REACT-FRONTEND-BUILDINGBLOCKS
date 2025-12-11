import { Button } from "@/components/ui/button";
import { Outlet } from "react-router-dom";
import {
    Bell,
    HelpCircle,
    KeyRound,
    MessageSquareText,
    PanelLeftOpen,
    Settings,
    User
} from "lucide-react";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import SideBarMenu from "@/components/SideBar";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    DropdownMenu, 
    DropdownMenuGroup, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { DropdownMenuContent } from "@radix-ui/react-dropdown-menu";

const AppLayout = () => {
    const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebarStore();

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <SideBarMenu />
            
            {/* Main Content */}
            <div
                className={cn(
                    "flex-1 transition-all duration-300 ml-16",
                    sidebarOpen ? "ml-64 w-[calc(100%-256px)]" : "ml-16 w-[calc(100%-64px)]",
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-primary px-4 shadow-sm">
                    <Button
                        size="icon"
                        onClick={toggleSidebar}
                        variant="ghost"
                    >
                        <PanelLeftOpen className={cn("h-5 w-5 text-primary-foreground", sidebarOpen && "rotate-180")} />
                    </Button>

                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-2 text-primary-foreground p-1 border rounded-full cursor-pointer">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage 
                                        src="https://t3.ftcdn.net/jpg/08/05/28/22/360_F_805282248_LHUxw7t2pnQ7x8lFEsS2IZgK8IGFXePS.jpg" 
                                        alt="User" 
                                    />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="end" 
                            className="bg-primary-foreground rounded w-full mt-1 shadow-lg px-1"
                        >
                            <DropdownMenuLabel>
                                My Account
                            </DropdownMenuLabel>
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" /> Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Change Password
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Bell className="mr-2 h-4 w-4" />
                                    Notifications
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem>
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    Help & Support
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <MessageSquareText className="mr-2 h-4 w-4" />
                                    Feedback
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Page Content */}
                <main className="p-6 overflow-x-hidden max-w-[1448px] mx-auto">
                    <Suspense fallback={null}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}

export default AppLayout;