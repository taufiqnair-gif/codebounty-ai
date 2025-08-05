"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, DollarSign, Clock, Shield, Target, TrendingUp, Users, Eye, Calendar } from "lucide-react"

interface Bounty {
  id: string
  title: string
  description: string
  reward: number
  duration: number
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "completed" | "expired"
  submissions: number
  timeLeft: number
  contractAddress: string
  owner: string
  category: string
}

export default function ExploreBountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [filteredBounties, setFilteredBounties] = useState<Bounty[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("reward")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("active")

  // Mock data
  useEffect(() => {
    const mockBounties: Bounty[] = [
      {
        id: "1",
        title: "DeFi Protocol Security Audit",
        description:
          "Comprehensive security review of our new DeFi lending protocol. Focus on reentrancy, flash loan attacks, and oracle manipulation.",
        reward: 50000,
        duration: 30,
        severity: "critical",
        status: "active",
        submissions: 12,
        timeLeft: 25,
        contractAddress: "0x1234...5678",
        owner: "0xabcd...efgh",
        category: "DeFi",
      },
      {
        id: "2",
        title: "NFT Marketplace Smart Contract Review",
        description: "Security audit for NFT marketplace with focus on royalty mechanisms and metadata handling.",
        reward: 25000,
        duration: 21,
        severity: "high",
        status: "active",
        submissions: 8,
        timeLeft: 18,
        contractAddress: "0x2345...6789",
        owner: "0xbcde...fghi",
        category: "NFT",
      },
      {
        id: "3",
        title: "Cross-Chain Bridge Audit",
        description:
          "Security review of cross-chain bridge implementation with focus on validator consensus and fund locking mechanisms.",
        reward: 75000,
        duration: 45,
        severity: "critical",
        status: "active",
        submissions: 15,
        timeLeft: 42,
        contractAddress: "0x3456...789a",
        owner: "0xcdef...ghij",
        category: "Bridge",
      },
      {
        id: "4",
        title: "DAO Governance Contract",
        description: "Audit of DAO governance mechanisms including proposal creation, voting, and execution.",
        reward: 30000,
        duration: 28,
        severity: "high",
        status: "active",
        submissions: 6,
        timeLeft: 22,
        contractAddress: "0x4567...89ab",
        owner: "0xdefg...hijk",
        category: "DAO",
      },
      {
        id: "5",
        title: "Token Staking Protocol",
        description: "Security review of token staking protocol with reward distribution and slashing mechanisms.",
        reward: 20000,
        duration: 14,
        severity: "medium",
        status: "completed",
        submissions: 23,
        timeLeft: 0,
        contractAddress: "0x5678...9abc",
        owner: "0xefgh...ijkl",
        category: "Staking",
      },
    ]
    setBounties(mockBounties)
    setFilteredBounties(mockBounties.filter((b) => b.status === "active"))
  }, [])

  // Filter and search logic
  useEffect(() => {
    const filtered = bounties.filter((bounty) => {
      const matchesSearch =
        bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bounty.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bounty.category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSeverity = filterSeverity === "all" || bounty.severity === filterSeverity
      const matchesStatus = filterStatus === "all" || bounty.status === filterStatus

      return matchesSearch && matchesSeverity && matchesStatus
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "reward":
          return b.reward - a.reward
        case "timeLeft":
          return a.timeLeft - b.timeLeft
        case "submissions":
          return a.submissions - b.submissions
        default:
          return 0
      }
    })

    setFilteredBounties(filtered)
  }, [bounties, searchTerm, sortBy, filterSeverity, filterStatus])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "expired":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Explore Bounties</h1>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredBounties.length} bounties found
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-cyber">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-cyber-glow">
                  {bounties.filter((b) => b.status === "active").length}
                </div>
                <div className="text-sm text-muted-foreground">Active Bounties</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-cyber-glow">
                  $
                  {bounties
                    .filter((b) => b.status === "active")
                    .reduce((sum, b) => sum + b.reward, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Rewards</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-cyber-glow">
                  {bounties.reduce((sum, b) => sum + b.submissions, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-cyber-glow">94.7%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-cyber">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search bounties by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-cyber"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] input-cyber">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reward">Highest Reward</SelectItem>
                <SelectItem value="timeLeft">Ending Soon</SelectItem>
                <SelectItem value="submissions">Least Submissions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[150px] input-cyber">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] input-cyber">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="all">All Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bounties List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBounties.map((bounty) => (
          <Card key={bounty.id} className="card-cyber hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{bounty.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getSeverityColor(bounty.severity)}>
                      {bounty.severity.charAt(0).toUpperCase() + bounty.severity.slice(1)}
                    </Badge>
                    <Badge variant="outline">{bounty.category}</Badge>
                    <Badge variant={getStatusColor(bounty.status)}>
                      {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyber-glow">${bounty.reward.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">USDC</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="line-clamp-3">{bounty.description}</CardDescription>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {bounty.status === "active"
                      ? `${bounty.timeLeft} days left`
                      : bounty.status === "completed"
                        ? "Completed"
                        : "Expired"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{bounty.submissions} submissions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{bounty.contractAddress}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{bounty.duration} day duration</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button size="sm" className="flex-1 btn-cyber-primary" disabled={bounty.status !== "active"}>
                  {bounty.status === "active" ? "Submit Audit" : "Unavailable"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBounties.length === 0 && (
        <Card className="card-cyber">
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No bounties found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters to find more bounties.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
