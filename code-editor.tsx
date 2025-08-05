"use client"
import { Editor } from "@monaco-editor/react"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  className?: string
}

export function CodeEditor({ value, onChange, placeholder, className }: CodeEditorProps) {
  return (
    <div className={cn("relative rounded-md overflow-hidden border border-primary/30", className)}>
      <Editor
        height="100%"
        language="solidity"
        value={value}
        onChange={onChange}
        theme="vs-dark" // Or 'light', 'dark'
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          // Placeholder logic (Monaco doesn't have native placeholder for editor content)
          // You might need a custom overlay for a true placeholder
        }}
      />
      {value === "" && placeholder && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center text-muted-foreground text-lg">
          {placeholder}
        </div>
      )}
    </div>
  )
}
