"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/hooks/use-wallet"
import { ConnectButton } from "@/components/connect-button"
import { Shield, Zap, Brain, Target, Users, ArrowRight, CheckCircle, Star, Lock, Coins } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Audits",
    description: "Advanced AI models analyze smart contracts for vulnerabilities with 95% accuracy",
    color: "text-purple-500",
  },
  {
    icon: Zap,
    title: "Instant Bounties",
    description: "Automatically create bounties for discovered vulnerabilities",
    color: "text-yellow-500",
  },
  {
    icon: Shield,
    title: "Decentralized Security",
    description: "Community-driven security with transparent on-chain verification",
    color: "text-blue-500",
  },
  {
    icon: Coins,
    title: "Earn Rewards",
    description: "Get paid in BTY tokens for finding and fixing security issues",
    color: "text-green-500",
  },
]

const stats = [
  { label: "Contracts Audited", value: "2,847", icon: Shield },
  { label: "Vulnerabilities Found", value: "1,293", icon: Target },
  { label: "Bounties Paid", value: "847 BTY", icon: Coins },
  { label: "Active Hunters", value: "156", icon: Users },
]

export default function HomePage() {
  const { isConnected, address } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Powered by AI & Blockchain
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
                Secure Smart Contracts
              </span>
              <br />
              <span className="text-foreground">with AI & Bounties</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Revolutionary platform combining AI-powered security audits with decentralized bounty hunting. Find
              vulnerabilities, earn rewards, and make Web3 safer.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isConnected ? (
                <>
                  <Button asChild size="lg" className="btn-cyber-primary">
                    <Link href="/scanner">
                      <Brain className="h-5 w-5 mr-2" />
                      Start AI Audit
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/bounties">
                      <Target className="h-5 w-5 mr-2" />
                      Explore Bounties
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <ConnectButton />
                  <Button asChild variant="outline" size="lg">
                    <Link href="/bounties">
                      View Demo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold text-cyber-glow mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose CodeBountyAI?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The most advanced platform for smart contract security, combining cutting-edge AI with community
              expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="card-cyber text-center">
                  <CardHeader>
                    <Icon className={`h-12 w-12 mx-auto mb-4 ${feature.color}`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple, secure, and rewarding process for everyone</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Submit Contract</h3>
              <p className="text-muted-foreground">Upload your smart contract for AI-powered security analysis</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Analysis</h3>
              <p className="text-muted-foreground">
                Advanced AI models scan for vulnerabilities and create bounties automatically
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Earn Rewards</h3>
              <p className="text-muted-foreground">
                Security hunters fix issues and earn BTY tokens for their contributions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="card-cyber max-w-4xl mx-auto text-center">
            <CardHeader>
              <CardTitle className="text-3xl sm:text-4xl font-bold mb-4">Ready to Secure Web3?</CardTitle>
              <CardDescription className="text-xl">
                Join thousands of developers and security experts making blockchain safer
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isConnected ? (
                  <>
                    <Button asChild size="lg" className="btn-cyber-primary">
                      <Link href="/owner/create-bounty">
                        <Shield className="h-5 w-5 mr-2" />
                        Create Bounty
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/hunter/explore-bounties">
                        <Target className="h-5 w-5 mr-2" />
                        Hunt Bounties
                      </Link>
                    </Button>
                  </>
                ) : (
                  <ConnectButton />
                )}
              </div>

              <div className="flex items-center justify-center mt-8 space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Decentralized
                </div>
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-blue-500" />
                  Secure
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-yellow-500" />
                  AI-Powered
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">CodeBountyAI</span>
              </div>
              <p className="text-muted-foreground">
                Making Web3 safer through AI-powered security audits and decentralized bounty hunting.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/scanner" className="hover:text-primary">
                    AI Scanner
                  </Link>
                </li>
                <li>
                  <Link href="/bounties" className="hover:text-primary">
                    Bounties
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-primary">
                    Profile
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/docs" className="hover:text-primary">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-primary">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-primary">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 CodeBountyAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
