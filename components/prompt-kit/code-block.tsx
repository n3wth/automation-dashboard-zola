"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import type {
  BundledLanguage,
  BundledTheme,
  Highlighter,
} from "shiki/bundle/web"

export type CodeBlockProps = {
  children?: ReactNode
  className?: string
} & React.HTMLProps<HTMLDivElement>

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "not-prose flex w-full flex-col overflow-clip border",
        "border-border bg-card text-card-foreground rounded-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export type CodeBlockCodeProps = {
  code: string
  language?: string
  theme?: string
  className?: string
} & React.HTMLProps<HTMLDivElement>

type ShikiBundle = {
  highlighter: Highlighter
  resolveLanguage: (language?: string) => BundledLanguage | null
}

const PLAIN_TEXT_LANGUAGES = new Set([
  "",
  "text",
  "plaintext",
  "plain",
  "nohighlight",
  "no-highlight",
])

let shikiBundlePromise: Promise<ShikiBundle> | null = null
const loadedLanguages = new Set<BundledLanguage>()

async function loadShikiBundle(): Promise<ShikiBundle> {
  if (!shikiBundlePromise) {
    shikiBundlePromise = import("shiki/bundle/web").then(async (mod) => {
      const { getSingletonHighlighter, bundledLanguagesInfo } = mod

      const aliasMap = new Map<string, BundledLanguage>()
      for (const info of bundledLanguagesInfo) {
        const id = info.id as BundledLanguage
        aliasMap.set(info.id.toLowerCase(), id)

        if (info.aliases) {
          for (const alias of info.aliases) {
            aliasMap.set(alias.toLowerCase(), id)
          }
        }
      }

      const highlighter = await getSingletonHighlighter({
        themes: ["github-dark", "github-light"],
      })

      return {
        highlighter,
        resolveLanguage(language?: string) {
          if (!language) return null
          const normalized = language.toLowerCase()
          if (PLAIN_TEXT_LANGUAGES.has(normalized)) return null
          return aliasMap.get(normalized) ?? null
        },
      }
    })
  }

  return shikiBundlePromise
}

async function ensureLanguageLoaded(
  highlighter: Highlighter,
  language: BundledLanguage
) {
  if (loadedLanguages.has(language)) return

  const loaded = highlighter.getLoadedLanguages()
  if (!loaded.includes(language)) {
    await highlighter.loadLanguage(language)
  }

  loadedLanguages.add(language)
}

function formatHighlightedHtml(html: string, language: BundledLanguage) {
  return html.replace(
    /<pre class="shiki([^"]*)"/,
    `<pre data-language="${language}" class="shiki overflow-x-auto rounded-none px-4 py-4 text-[13px] leading-6$1"`
  )
}

function CodeBlockCode({
  code,
  language,
  className,
  ...props
}: CodeBlockCodeProps) {
  const { resolvedTheme } = useTheme()
  const theme: BundledTheme =
    resolvedTheme === "light" ? "github-light" : "github-dark"

  const normalizedCode = useMemo(() => {
    if (!code) return ""
    return code.replace(/\r?\n$/, "")
  }, [code])

  const normalizedLanguage = useMemo(() => language?.toLowerCase(), [language])
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function highlight() {
      if (!normalizedCode) {
        if (isMounted) setHighlightedHtml(null)
        return
      }

      try {
        if (!normalizedLanguage || PLAIN_TEXT_LANGUAGES.has(normalizedLanguage)) {
          if (isMounted) setHighlightedHtml(null)
          return
        }

        const { highlighter, resolveLanguage } = await loadShikiBundle()
        const resolvedLanguage = resolveLanguage(normalizedLanguage)

        if (!resolvedLanguage) {
          if (isMounted) setHighlightedHtml(null)
          return
        }

        await ensureLanguageLoaded(highlighter, resolvedLanguage)

        const html = await highlighter.codeToHtml(normalizedCode, {
          lang: resolvedLanguage,
          theme,
        })

        if (!isMounted) return

        setHighlightedHtml(formatHighlightedHtml(html, resolvedLanguage))
      } catch (error) {
        console.error("Failed to highlight code block", error)
        if (isMounted) setHighlightedHtml(null)
      }
    }

    highlight()

    return () => {
      isMounted = false
    }
  }, [normalizedCode, normalizedLanguage, theme])

  const classNames = cn("relative w-full font-mono text-[13px]", className)
  const fallbackCode = normalizedCode || ""

  return (
    <div className={classNames} {...props}>
      {highlightedHtml ? (
        <div
          className="w-full [&_pre]:m-0"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre
          className="overflow-x-auto rounded-none px-4 py-4 !bg-background"
          data-language={normalizedLanguage ?? "text"}
        >
          <code className={normalizedLanguage ? `language-${normalizedLanguage}` : undefined}>
            {fallbackCode}
          </code>
        </pre>
      )}
    </div>
  )
}

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>

function CodeBlockGroup({
  children,
  className,
  ...props
}: CodeBlockGroupProps) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock }
