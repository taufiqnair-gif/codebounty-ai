"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2, ShieldCheck, AlertTriangle, Lightbulb } from "lucide-react"
import { CodeEditor } from "@/components/code-editor"
import { useToast } from "@/hooks/use-toast"
import { performAudit } from "@/lib/audit-service"
import type { AuditResult } from "@/types/audit"
import { useWallet } from "@/hooks/use-wallet"

export default function AIAuditPage() {
  const [code, setCode] = useState("")
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { isConnected, address } = useWallet()

  const handleAudit = async () => {
    if (!code) {
      toast({
        title: "No Code Provided",
        description: "Please enter Solidity code to perform an AI audit.",
        variant: "destructive",
      })
      return
    }
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to run an AI audit.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setAuditResult(null)
    try {
      const result = await performAudit(code)
      setAuditResult(result)
      toast({
        title: "Audit Complete",
        description: "AI audit successfully performed!",
      })
    } catch (error) {
      console.error("AI Audit failed:", error)
      toast({
        title: "Audit Failed",
        description: "There was an error performing the AI audit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">AI Smart Contract Audit</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        Paste your Solidity code below to get an instant, AI-powered security audit. Identify vulnerabilities and
        receive recommendations.
      </p>

      <Card className="card-cyber max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
            <Sparkles className="h-6 w-6" /> Audit Your Code
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your Solidity smart contract code for analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="solidity-code" className="text-muted-foreground">
              Solidity Contract Code
            </Label>
            <div className="h-[400px] border border-gray-700 rounded-md overflow-hidden">
              <CodeEditor value={code} onChange={setCode} language="solidity" />
            </div>
          </div>

          <Button
            onClick={handleAudit}
            disabled={loading || !isConnected}
            className="btn-cyber-primary w-full text-lg py-3"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Running Audit...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> Run AI Audit
              </>
            )}
          </Button>

          {auditResult && (
            <div className="mt-8 space-y-6">
              <h2 className="text-3xl font-bold text-cyber-glow text-center">Audit Results</h2>

              <Card className="card-cyber">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> Security Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div
                    className={cn(
                      "text-6xl font-bold",
                      auditResult.score >= 90 && "text-green-400",
                      auditResult.score >= 70 && auditResult.score < 90 && "text-yellow-400",
                      auditResult.score < 70 && "text-red-400",
                    )}
                  >
                    {auditResult.score}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Overall security score out of 100.
                    <br />
                    <span className="text-sm">Execution Time: {auditResult.executionTime}</span>
                  </p>
                </CardContent>
              </Card>

              {auditResult.vulnerabilities.length > 0 && (
                <Card className="card-cyber">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" /> Identified Vulnerabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {auditResult.vulnerabilities.map((vuln, index) => (
                      <div key={index} className="p-4 rounded-md bg-red-500/10 border border-red-500/20">
                        <h3 className="font-medium text-red-400">
                          {vuln.type} (Severity: {vuln.severity})
                        </h3>
                        <p className="text-sm text-gray-300 mt-1">{vuln.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          File: {vuln.file} | Line: {vuln.line}
                        </p>
                        <pre className="mt-2 p-2 bg-gray-800 rounded-md text-xs text-gray-200 overflow-x-auto">
                          <code>{vuln.snippet}</code>
                        </pre>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="card-cyber">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-400" /> Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {auditResult.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
