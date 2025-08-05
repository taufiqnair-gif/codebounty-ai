export interface Vulnerability {
  id: string
  type: string
  severity: "High" | "Medium" | "Low"
  description: string
  line: number
  file: string
  snippet: string // Code snippet where the vulnerability was found
}

export interface AuditResult {
  id: string
  timestamp: string
  codeSnippet: string
  score: number // Overall security score (e.g., 0-100)
  vulnerabilities: Vulnerability[]
  recommendations: string[]
  executionTime: string // e.g., "5s"
}
