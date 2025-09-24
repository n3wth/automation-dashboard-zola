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
import { cn } from "@/lib/utils"
import { ArrowUpIcon, StopIcon } from "@phosphor-icons/react"
import { useCallback, useEffect, useMemo, useRef } from "react"
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
}: ChatInputProps) {
  const selectModelConfig = getModelInfo(selectedModel)
  const hasSearchSupport = Boolean(selectModelConfig?.webSearch)
  const isOnlyWhitespace = (text: string) => !/[^\s]/.test(text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fix hydration mismatch by using client-side state
  const placeholder = "Ask Bob..."

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
    [isSubmitting, onSend, status, value]
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
            "bg-black text-white relative z-10 p-0 pt-1 shadow-xs backdrop-blur-xl border-white/20",
            isAtCharacterLimit && "border-destructive focus-within:border-destructive",
            !isAtCharacterLimit && shouldShowLongInputHint && "border-amber-400/80 focus-within:border-amber-400/90"
          )}
          maxHeight={200}
          value={value}
          onValueChange={handleValueChange}
        >
          <FileList files={files} onFileRemove={onFileRemove} />
          <PromptInputTextarea
            ref={textareaRef}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
            aria-invalid={isErrored}
            aria-describedby={textareaDescribedBy}
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
              <PromptInputAction
                tooltip={status === "streaming" ? "Stop" : "Send"}
              >
                <Button
                  id="chat-send-button"
                  data-testid="chat-send-button"
                  size="sm"
                  className="size-9 rounded-full transition-all duration-300 ease-out"
                  disabled={isSendDisabled}
                  type="button"
                  onClick={handleSend}
                  aria-label={status === "streaming" ? "Stop" : "Send message"}
                  aria-busy={isSubmitting || isStreaming || isAwaitingResponse}
                >
                  {status === "streaming" ? (
                    <StopIcon className="size-4" />
                  ) : (
                    <ArrowUpIcon className="size-4" />
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
