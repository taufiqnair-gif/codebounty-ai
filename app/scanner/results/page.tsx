"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeViewer } from "@/components/code-viewer"
import { ScoreChart } from "@/components/score-chart"
import { VulnerabilityTable } from "@/components/vulnerability-table"
import type { AuditResult } from "@/types/audit"
import { getAuditResult } from "@/lib/audit-service"
import { Loader2 } from "lucide-react"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const auditId = searchParams.get("auditId")
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (auditId) {
      const fetchAudit = async () => {
        try {
          setLoading(true)
          const result = await getAuditResult(auditId)
          setAuditResult(result)
        } catch (err) {
          console.error("Failed to fetch audit result:", err)
          setError("Failed to load audit results. Please try again.")
        } finally {
          setLoading(false)
        }
      }
      fetchAudit()
    } else {
      setLoading(false)
      setError("No audit ID provided.")
    }
  }, [auditId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading audit results...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-destructive">
        <p className="text-lg">{error}</p>
        <Button onClick={() => window.history.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  if (!auditResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <p className="text-lg text-muted-foreground">No audit results found for this ID.</p>
        <Button onClick={() => window.history.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const { score, vulnerabilities, codeSnippet, recommendations } = auditResult

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Audit Results</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="card-cyber lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Overall Score</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ScoreChart score={score} />
          </CardContent>
        </Card>

        <Card className="card-cyber lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="card-cyber mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Detected Vulnerabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <VulnerabilityTable vulnerabilities={vulnerabilities} />
        </CardContent>
      </Card>

      <Card className="card-cyber mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Audited Code Snippet</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeViewer code={codeSnippet} language="solidity" />
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={() => window.history.back()} className="btn-cyber-primary">
          Perform Another Audit
        </Button>
      </div>
    </div>
  )
}
