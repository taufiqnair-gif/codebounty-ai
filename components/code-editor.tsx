"use client"
import Editor from "@monaco-editor/react"

interface CodeEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language: string
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, language, readOnly = false }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{
        readOnly: readOnly,
        minimap: { enabled: false },
        wordWrap: "on",
        showUnused: false,
        folding: false,
        lineNumbersMinChars: 3,
        fontSize: 14,
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  )
}
