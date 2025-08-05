"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, UploadCloud, Sparkles } from "lucide-react"
import { performAudit } from "@/lib/audit-service"
import { useToast } from "@/hooks/use-toast"

export default function ScannerPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleAudit = async () => {
    if (!code.trim()) {
      setError("Please enter some Solidity code to audit.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await performAudit(code)
      toast({
        title: "Audit Complete",
        description: "Your smart contract has been audited successfully!",
      })
      router.push(`/scanner/results?auditId=${result.id}`)
    } catch (err) {
      console.error("Audit failed:", err)
      setError("Failed to perform audit. Please try again.")
      toast({
        title: "Audit Failed",
        description: "There was an error performing the audit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">AI Smart Contract Auditor</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        Paste your Solidity smart contract code below to get an instant AI-powered security audit and recommendations.
      </p>

      <Card className="card-cyber max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
            <UploadCloud className="h-6 w-6" /> Enter Your Solidity Code
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Supports Solidity versions ^0.8.0. Max 1000 lines of code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full gap-4">
            <Label htmlFor="solidity-code" className="sr-only">
              Solidity Code
            </Label>
            <Textarea
              id="solidity-code"
              placeholder={`pragma solidity ^0.8.0;\n\ncontract MyContract {\n  // Your code here\n}`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError(null) // Clear error on input change
              }}
              className="min-h-[300px] font-mono text-base input-cyber"
            />
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            <Button onClick={handleAudit} disabled={loading} className="btn-cyber-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Auditing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run AI Audit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
