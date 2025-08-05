"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { getContractInstance } from "@/lib/contract-service"
import type { AuditEngineContract } from "@/types/contracts"
import { toast } from "@/components/ui/use-toast"

export function AiAuditTrigger() {
  const { signer, isConnected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [codeHash, setCodeHash] = useState("")
  const [auditResultId, setAuditResultId] = useState<string | null>(null)

  const handleTriggerAudit = async () => {
    if (!signer || !codeHash) {
      toast({
        title: "Error",
        description: "Please connect wallet and enter a code hash.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setAuditResultId(null)
    try {
      const auditEngine = getContractInstance<AuditEngineContract>("AuditEngine", signer)
      // Assuming performAudit takes a string codeHash and returns an auditId (BigInt)
      const tx = await auditEngine.performAudit(codeHash)
      const receipt = await tx.wait()

      // In a real scenario, you'd parse events from the receipt to get the auditId
      // For mock, we'll just use a placeholder or a derived ID
      const mockAuditId = `audit-${Math.random().toString(36).substring(2, 11)}`
      setAuditResultId(mockAuditId)

      toast({
        title: "Audit Triggered",
        description: `AI audit for hash ${codeHash.substring(0, 10)}... triggered. Result ID: ${mockAuditId}`,
      })
      setCodeHash("")
    } catch (error: any) {
      console.error("Failed to trigger AI audit:", error)
      toast({
        title: "Error",
        description: `Failed to trigger AI audit: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="card-cyber">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Trigger AI Audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="code-hash" className="text-muted-foreground">
            Code Hash to Audit
          </Label>
          <div className="flex gap-2">
            <Input
              id="code-hash"
              type="text"
              placeholder="e.g., 0xabcdef1234567890..."
              value={codeHash}
              onChange={(e) => setCodeHash(e.target.value)}
              className="input-cyber"
              disabled={!isConnected || loading}
            />
            <Button onClick={handleTriggerAudit} disabled={!isConnected || loading} className="btn-cyber-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Trigger Audit"}
            </Button>
          </div>
        </div>

        {auditResultId && (
          <div className="text-center text-green-400">
            Audit triggered successfully! Result ID: <span className="font-mono">{auditResultId}</span>
            <p className="text-sm text-muted-foreground mt-1">(In a real app, you'd fetch results using this ID)</p>
          </div>
        )}

        {!isConnected && <p className="text-center text-muted-foreground">Connect your wallet to trigger AI audits.</p>}
      </CardContent>
    </Card>
  )
}
