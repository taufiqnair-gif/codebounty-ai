"use client"

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Card, CardContent } from "./ui/card"

interface CodeViewerProps {
  code: string
  language: string
}

export function CodeViewer({ code, language }: CodeViewerProps) {
  return (
    <Card className="card-cyber overflow-hidden">
      <CardContent className="p-0">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            padding: "1rem",
            backgroundColor: "var(--card)",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
          }}
          lineNumberStyle={{
            color: "var(--muted-foreground)",
            minWidth: "2.5em",
            paddingRight: "1em",
            borderRight: "1px solid var(--border)",
            marginRight: "1em",
            userSelect: "none",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </CardContent>
    </Card>
  )
}
