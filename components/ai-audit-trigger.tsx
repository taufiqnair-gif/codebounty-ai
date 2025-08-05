"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export function AiAuditTrigger() {
  const router = useRouter()

  const handleClick = () => {
    router.push("/scanner")
  }

  return (
    <Button onClick={handleClick} className="btn-cyber-primary">
      <Sparkles className="mr-2 h-4 w-4" /> AI Audit
    </Button>
  )
}
