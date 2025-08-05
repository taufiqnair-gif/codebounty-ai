"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useWallet } from "@/hooks/use-wallet"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Shield,
  Zap,
  Brain,
  Target,
  Wallet,
  BarChart3,
  Gavel,
  Settings,
  Award,
  Users,
  Search,
  Upload,
  Network,
  Flag,
  Trophy,
  Coins,
} from "lucide-react"

const ownerNavigation = [
  {
    title: "Dashboard",
    items: [
      { name: "Overview", href: "/owner/dashboard", icon: BarChart3 },
      { name: "Analytics", href: "/owner/leaderboard-analytics", icon: Users },
      { name: "AI Audit Dashboard", href: "/owner/ai-audit-dashboard", icon: Brain },
    ],
  },
  {
    title: "Bounty Management",
    items: [
      { name: "Create Bounty", href: "/owner/create-bounty", icon: Target },
      { name: "My Bounties", href: "/owner/bounties", icon: Zap },
      { name: "Deposit Vault", href: "/owner/deposit-vault", icon: Wallet },
    ],
  },
  {
    title: "Governance",
    items: [
      { name: "Dispute Resolution", href: "/owner/dispute-resolve", icon: Gavel },
      { name: "Protocol Governance", href: "/owner/governance", icon: Settings },
    ],
  },
]

const hunterNavigation = [
  {
    title: "Hunt & Earn",
    items: [
      { name: "Explore Bounties", href: "/hunter/explore-bounties", icon: Search },
      { name: "Submit Audit", href: "/hunter/submit-audit", icon: Upload },
      { name: "AI Audit Tool", href: "/hunter/ai-audit", icon: Brain },
    ],
  },
  {
    title: "Rewards & Reputation",
    items: [
      { name: "Claim & Bridge", href: "/hunter/claim-bridge", icon: Network },
      { name: "Audit NFTs", href: "/hunter/audit-nft", icon: Award },
      { name: "Leaderboard", href: "/hunter/leaderboard-badges", icon: Trophy },
    ],
  },
  {
    title: "Account Management",
    items: [
      { name: "Multi-Wallet", href: "/hunter/multi-wallet", icon: Coins },
      { name: "Dispute & Appeal", href: "/hunter/dispute-appeal", icon: Flag },
    ],
  },
]

interface RoleSidebarProps {
  role: "owner" | "hunter"
}

export function RoleSidebar({ role }: RoleSidebarProps) {
  const pathname = usePathname()
  const { isConnected } = useWallet()

  const navigation = role === "owner" ? ownerNavigation : hunterNavigation
  const roleTitle = role === "owner" ? "Project Owner" : "Security Hunter"
  const roleIcon = role === "owner" ? Shield : Target

  const isActive = (href: string) => pathname === href

  if (!isConnected) {
    return null
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarContent>
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              {role === "owner" ? (
                <Shield className="h-5 w-5 text-blue-500" />
              ) : (
                <Target className="h-5 w-5 text-green-500" />
              )}
              <span className="font-semibold">{roleTitle}</span>
              <Badge variant="outline" className="text-xs">
                {role}
              </Badge>
            </div>
            <Separator />
          </div>

          {navigation.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={isActive(item.href)}>
                          <Link href={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <div className="mt-auto p-4">
            <Separator className="mb-4" />
            <div className="text-xs text-muted-foreground">
              <p>Switch roles anytime from your profile</p>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
