"use client"

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs"

interface CodeViewerProps {
  code: string
  language: string
}

export function CodeViewer({ code, language }: CodeViewerProps) {
  return (
    <div className="overflow-auto rounded-md bg-gray-800 p-4 text-sm">
      <SyntaxHighlighter language={language} style={atomOneDark} customStyle={{ background: "transparent" }}>
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
