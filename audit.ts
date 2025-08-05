export interface Vulnerability {
  type: string
  severity: "Low" | "Medium" | "High"
  description: string
  line: number
  file: string
}

export interface AuditResult {
  id: string
  timestamp: string
  codeSnippet: string
  score: number
  vulnerabilities: Vulnerability[]
  recommendations: string[]
}
