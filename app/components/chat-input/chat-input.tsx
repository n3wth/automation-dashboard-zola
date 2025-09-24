"use client"

import { ModelSelector } from "@/components/common/model-selector/base"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { getModelInfo } from "@/lib/models"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { cn } from "@/lib/utils"
import { ArrowUpIcon, Spinner, StopIcon } from "@phosphor-icons/react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { PromptSystem } from "../suggestions/prompt-system"
import { ButtonFileUpload } from "./button-file-upload"
import { ButtonSearch } from "./button-search"
import { FileList } from "./file-list"

const MAX_CHAT_INPUT_CHARACTERS = 4000
const LONG_INPUT_HINT_THRESHOLD = Math.floor(MAX_CHAT_INPUT_CHARACTERS * 0.75)

const clampChatInputValue = (text: string) =>
  text.length > MAX_CHAT_INPUT_CHARACTERS
    ? text.slice(0, MAX_CHAT_INPUT_CHARACTERS)
    : text

type ChatInputProps = {
  value: string
  onValueChange: (value: string) => void
  onSend: () => void
  isSubmitting?: boolean
  hasMessages?: boolean
  files: File[]
  onFileUpload: (files: File[]) => void
  onFileRemove: (file: File) => void
  onSuggestion: (suggestion: string) => void
  hasSuggestions?: boolean
  onSelectModel: (model: string) => void
  selectedModel: string
  isUserAuthenticated: boolean
  stop: () => void
  status?: "submitted" | "streaming" | "ready" | "error"
  setEnableSearch: (enabled: boolean) => void
  enableSearch: boolean
  quotedText?: { text: string; messageId: string } | null
}

export function ChatInput({
  value,
  onValueChange,
  onSend,
  isSubmitting,
  files,
  onFileUpload,
  onFileRemove,
  onSuggestion,
  hasSuggestions,
  onSelectModel,
  selectedModel,
  isUserAuthenticated,
  stop,
  status,
  setEnableSearch,
  enableSearch,
  quotedText,
  hasMessages,
}: ChatInputProps) {
  const selectModelConfig = getModelInfo(selectedModel)
  const hasSearchSupport = Boolean(selectModelConfig?.webSearch)
  const isOnlyWhitespace = (text: string) => !/[^\s]/.test(text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fix hydration mismatch by using client-side state
  const placeholder = "Ask Bob..."

  const hasAnyMessages = Boolean(hasMessages)
  const shouldShowAuthReminder =
    isSupabaseEnabled && !isUserAuthenticated && !hasAnyMessages

  const handleValueChange = useCallback(
    (nextValue: string) => {
      onValueChange(clampChatInputValue(nextValue))
    },
    [onValueChange]
  )

  useEffect(() => {
    if (value.length > MAX_CHAT_INPUT_CHARACTERS) {
      handleValueChange(value)
    }
  }, [value, handleValueChange])

  const inputLength = value.length
  const hasInput = inputLength > 0 && !isOnlyWhitespace(value)
  const isStreaming = status === "streaming"
  const isAwaitingResponse = status === "submitted"
  const isProcessingMessage = !isStreaming && (isSubmitting || isAwaitingResponse)
  const isSendDisabled = !isStreaming && (!hasInput || isSubmitting || isAwaitingResponse)
  const isErrored = status === "error"
  const errorMessageId = isErrored ? "chat-input-error" : undefined
  const isAtCharacterLimit = inputLength >= MAX_CHAT_INPUT_CHARACTERS
  const shouldShowLongInputHint =
    !isAtCharacterLimit && inputLength >= LONG_INPUT_HINT_THRESHOLD
  const formattedInputLength = inputLength.toLocaleString()
  const formattedMaxLength = MAX_CHAT_INPUT_CHARACTERS.toLocaleString()

  let lengthMessageId: string | undefined
  let lengthMessage: string | undefined
  let lengthMessageTone: "warning" | "error" | undefined

  if (isAtCharacterLimit) {
    lengthMessageId = "chat-input-character-limit"
    lengthMessage = `You've reached the ${formattedMaxLength}-character limit.`
    lengthMessageTone = "error"
  } else if (shouldShowLongInputHint) {
    lengthMessageId = "chat-input-length-warning"
    lengthMessage = "Long prompts may slow things down. Consider trimming your message."
    lengthMessageTone = "warning"
  }

  const describedByIds = [errorMessageId, lengthMessageId]
    .filter(Boolean)
    .join(" ")
    .trim()
  const textareaDescribedBy = describedByIds.length > 0 ? describedByIds : undefined

  const sendButtonState = isStreaming
    ? "streaming"
    : isProcessingMessage
      ? "loading"
      : "idle"
  const sendButtonTooltip =
    sendButtonState === "streaming"
      ? "Stop"
      : sendButtonState === "loading"
        ? "Sending"
        : "Send"
  const sendButtonAriaLabel =
    sendButtonState === "streaming"
      ? "Stop response"
      : sendButtonState === "loading"
        ? "Sending message"
        : "Send message"

  const handleSend = useCallback(() => {
    if (isSubmitting) {
      return
    }

    if (status === "streaming") {
      stop()
      return
    }

    onSend()
  }, [isSubmitting, onSend, status, stop])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isSubmitting) {
        e.preventDefault()
        return
      }

      if (e.key === "Escape" && (status === "streaming" || status === "submitted")) {
        e.preventDefault()
        stop()
        return
      }

      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        if (status === "streaming") {
          e.preventDefault()
          stop()
          return
        }

        if (isOnlyWhitespace(value)) {
          e.preventDefault()
          return
        }

        e.preventDefault()
        onSend()
        return
      }

      if (e.key === "Enter" && status === "streaming") {
        e.preventDefault()
        return
      }

      if (e.key === "Enter" && !e.shiftKey) {
        if (isOnlyWhitespace(value)) {
          return
        }

        e.preventDefault()
        onSend()
      }
    },
    [isSubmitting, onSend, status, stop, value]
  )

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const hasImageContent = Array.from(items).some((item) =>
        item.type.startsWith("image/")
      )

      if (!isUserAuthenticated && hasImageContent) {
        e.preventDefault()
        return
      }

      if (isUserAuthenticated && hasImageContent) {
        const imageFiles: File[] = []

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile()
            if (file) {
              const newFile = new File(
                [file],
                `pasted-image-${Date.now()}.${file.type.split("/")[1]}`,
                { type: file.type }
              )
              imageFiles.push(newFile)
            }
          }
        }

        if (imageFiles.length > 0) {
          onFileUpload(imageFiles)
        }
      }
      // Text pasting will work by default for everyone
    },
    [isUserAuthenticated, onFileUpload]
  )

  useEffect(() => {
    if (quotedText) {
      const quoted = quotedText.text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")
      handleValueChange(value ? `${value}\n\n${quoted}\n\n` : `${quoted}\n\n`)

      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when quoting new text
  }, [quotedText, handleValueChange])

  useMemo(() => {
    if (!hasSearchSupport && enableSearch) {
      setEnableSearch?.(false)
    }
  }, [hasSearchSupport, enableSearch, setEnableSearch])

  return (
    <div className="relative flex w-full flex-col gap-4">
      {hasSuggestions && (
        <PromptSystem
          onValueChange={handleValueChange}
          onSuggestion={onSuggestion}
          value={value}
        />
      )}
      <div
        className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1"
        onClick={() => textareaRef.current?.focus()}
      >
        <PromptInput
          className={cn(
            "relative z-10 border-border/60 bg-background/95 p-0 pt-1 text-foreground shadow-xs backdrop-blur-xl",
            isAtCharacterLimit && "border-destructive focus-within:border-destructive",
            !isAtCharacterLimit && shouldShowLongInputHint && "border-amber-400/80 focus-within:border-amber-400/90"
          )}
          maxHeight={200}
          value={value}
          onValueChange={handleValueChange}
        >
          {shouldShowAuthReminder ? (
            <div
              className="border-white/15 bg-white/5 text-white/80 mb-2 flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              role="status"
              aria-live="polite"
            >
              <span className="text-left">
                <span className="text-white font-medium">You&apos;re chatting as a guest.</span>{" "}
                Sign in to save your conversations and unlock higher daily limits.
              </span>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
              >
                <Link href="/auth">Sign in to continue</Link>
              </Button>
            </div>
          ) : null}
          <FileList files={files} onFileRemove={onFileRemove} />
          <PromptInputTextarea
            ref={textareaRef}
            data-testid="chat-input-textarea"
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
            aria-invalid={isErrored}
            aria-describedby={textareaDescribedBy}
            aria-label="Message input"
            maxLength={MAX_CHAT_INPUT_CHARACTERS}
          />
          <PromptInputActions className="mt-3 w-full justify-between p-2">
            <div className="flex gap-2">
              <ButtonFileUpload
                onFileUpload={onFileUpload}
                isUserAuthenticated={isUserAuthenticated}
                model={selectedModel}
              />
              <ModelSelector
                selectedModelId={selectedModel}
                setSelectedModelId={onSelectModel}
                isUserAuthenticated={isUserAuthenticated}
                className="rounded-full"
              />
              {hasSearchSupport ? (
                <ButtonSearch
                  isSelected={enableSearch}
                  onToggle={setEnableSearch}
                  isAuthenticated={isUserAuthenticated}
                />
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span
                data-testid="chat-input-character-count"
                aria-live="polite"
                className={cn(
                  "text-xs font-medium tabular-nums transition-colors",
                  isAtCharacterLimit
                    ? "text-destructive"
                    : shouldShowLongInputHint
                      ? "text-amber-400"
                      : "text-muted-foreground"
                )}
              >
                {formattedInputLength} / {formattedMaxLength}
              </span>
              <PromptInputAction tooltip={sendButtonTooltip}>
                <Button
                  id="chat-send-button"
                  data-testid="chat-send-button"
                  size="icon"
                  className={cn(
                    "group relative size-9 rounded-full bg-white text-black shadow-[0_10px_30px_rgba(15,15,15,0.2)]",
                    "transition-all duration-200 ease-out",
                    "hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_18px_40px_rgba(15,15,15,0.28)]",
                    "active:scale-95",
                    "disabled:translate-y-0 disabled:bg-white/15 disabled:text-white/50 disabled:shadow-none disabled:!opacity-80 disabled:!cursor-not-allowed",
                    "data-[state=streaming]:bg-rose-500 data-[state=streaming]:text-white",
                    "data-[state=streaming]:hover:bg-rose-500/90 data-[state=streaming]:shadow-[0_16px_36px_rgba(244,63,94,0.45)] data-[state=streaming]:hover:shadow-[0_20px_44px_rgba(244,63,94,0.5)]",
                    "data-[state=loading]:bg-white/70 data-[state=loading]:text-black/70 data-[state=loading]:shadow-[0_10px_30px_rgba(255,255,255,0.2)]",
                    "data-[state=loading]:!cursor-wait data-[state=loading]:!opacity-100"
                  )}
                  disabled={isSendDisabled}
                  type="button"
                  onClick={handleSend}
                  aria-label={sendButtonAriaLabel}
                  aria-busy={isSubmitting || isStreaming || isAwaitingResponse}
                  data-state={sendButtonState}
                >
                  {sendButtonState === "streaming" ? (
                    <StopIcon className="size-4 transition-transform duration-200 group-hover:scale-105" />
                  ) : sendButtonState === "loading" ? (
                    <Spinner className="size-4 animate-spin" />
                  ) : (
                    <ArrowUpIcon className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0 group-active:scale-90" />
                  )}
                </Button>
              </PromptInputAction>
            </div>
          </PromptInputActions>
          {lengthMessage && (
            <p
              id={lengthMessageId}
              aria-live="polite"
              className={cn(
                "px-4 pb-3 text-xs",
                lengthMessageTone === "error" ? "text-destructive" : "text-amber-400"
              )}
            >
              {lengthMessage}
            </p>
          )}
          {isErrored ? (
            <div
              id={errorMessageId}
              role="status"
              aria-live="polite"
              className="text-destructive px-4 pb-3 text-xs"
            >
              Message failed to send. Try again.
            </div>
          ) : null}
        </PromptInput>
      </div>
    </div>
  )
}
