"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ConnectButton } from "@/components/connect-button"
import { ModeToggle } from "@/components/mode-toggle"
import { useWallet } from "@/hooks/use-wallet"
import { Menu, Shield, Zap, Search, User, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Scanner", href: "/scanner", icon: Search },
  { name: "Bounties", href: "/bounties", icon: Zap },
  { name: "Profile", href: "/profile", icon: User },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { isConnected, address } = useWallet()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            CodeBountyAI
          </span>
          <Badge variant="secondary" className="text-xs">
            Beta
          </Badge>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          <ModeToggle />
          <ConnectButton />

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 text-lg font-medium transition-colors hover:text-primary p-2 rounded-md",
                        isActive(item.href) ? "text-primary bg-primary/10" : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                {isConnected && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Connected as:</p>
                      <p className="font-mono text-sm bg-muted p-2 rounded">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 text-lg font-medium transition-colors hover:text-primary p-2 rounded-md"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
