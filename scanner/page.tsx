"use client"

import { CardFooter } from "@/components/ui/card"
import { Code } from "lucide-react" // Import the Code component

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { performAudit } from "@/lib/audit-service"
import { Loader2 } from "lucide-react"
import { CodeEditor } from "@/components/code-editor"
import { useRouter } from "next/navigation"
import { useWallet } from "@/hooks/use-wallet"

export default function ScannerPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { address, isConnected } = useWallet()

  const handleAudit = async () => {
    if (!code.trim()) {
      setError("Please enter Solidity code to audit.")
      return
    }

    if (!isConnected) {
      setError("Please connect your wallet to continue.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await performAudit(code)
      router.push(`/scanner/results?auditId=${result.id}`)
    } catch (err) {
      console.error("Audit failed:", err)
      setError("Failed to perform audit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black">
      <div className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm mb-6">
            <Shield className="mr-2 h-4 w-4 text-blue-400" />
            <span className="text-blue-300">AI-Powered Security Analysis</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Smart Contract Scanner
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload your smart contract and let our AI analyze it for vulnerabilities in real-time
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 rounded-xl border border-gray-800/50 bg-gray-900/20">
            <Zap className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-400">Analysis completes in under 2 seconds</p>
          </div>
          <div className="text-center p-6 rounded-xl border border-gray-800/50 bg-gray-900/20">
            <Shield className="h-8 w-8 text-purple-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">99.7% Accurate</h3>
            <p className="text-sm text-gray-400">Industry-leading vulnerability detection</p>
          </div>
          <div className="text-center p-6 rounded-xl border border-gray-800/50 bg-gray-900/20">
            <Code className="h-8 w-8 text-pink-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Comprehensive</h3>
            <p className="text-sm text-gray-400">Covers all major vulnerability types</p>
          </div>
        </div>

        {/* Main Scanner Card */}
        <Card className="border-gray-800/50 bg-gray-900/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Upload Your Contract</CardTitle>
            <CardDescription className="text-gray-400">
              Paste your contract code below to get an AI-powered security audit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <CodeEditor
                value={code}
                onChange={setCode}
                placeholder="Paste your Solidity code here..."
                className="min-h-[300px]"
              />
              {error && <p className="text-destructive text-center">{error}</p>}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleAudit}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                  Auditing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-3" />
                  Run AI Security Audit
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="border-gray-800/50 bg-gray-900/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-400" />
                What We Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
              <div>• Reentrancy vulnerabilities</div>
              <div>• Access control issues</div>
              <div>• Integer overflow/underflow</div>
              <div>• Gas optimization opportunities</div>
              <div>• Logic errors and edge cases</div>
            </CardContent>
          </Card>

          <Card className="border-gray-800/50 bg-gray-900/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Zap className="h-5 w-5 mr-2 text-purple-400" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
              <div>• AI analyzes your contract code</div>
              <div>• Parallel execution on Hyperion</div>
              <div>• Real-time vulnerability detection</div>
              <div>• Automated bounty creation</div>
              <div>• Community-driven fixes</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

const Zap = () => null
const Shield = () => null
const Upload = () => null
