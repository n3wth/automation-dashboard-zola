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
import { ArrowUpIcon, Spinner, StopIcon } from "@phosphor-icons/react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { PromptSystem } from "../suggestions/prompt-system"
import { ButtonFileUpload } from "./button-file-upload"
import { ButtonSearch } from "./button-search"
import { FileList } from "./file-list"

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

  const hasInput = value.length > 0 && !isOnlyWhitespace(value)
  const isStreaming = status === "streaming"
  const isAwaitingResponse = status === "submitted"
  const isProcessingMessage = !isStreaming && (isSubmitting || isAwaitingResponse)
  const isSendDisabled = !isStreaming && (!hasInput || isSubmitting || isAwaitingResponse)
  const isErrored = status === "error"
  const errorMessageId = isErrored ? "chat-input-error" : undefined

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
      onValueChange(value ? `${value}\n\n${quoted}\n\n` : `${quoted}\n\n`)

      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotedText, onValueChange])

  useMemo(() => {
    if (!hasSearchSupport && enableSearch) {
      setEnableSearch?.(false)
    }
  }, [hasSearchSupport, enableSearch, setEnableSearch])

  return (
    <div className="relative flex w-full flex-col gap-4">
      {hasSuggestions && (
        <PromptSystem
          onValueChange={onValueChange}
          onSuggestion={onSuggestion}
          value={value}
        />
      )}
      <div
        className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1"
        onClick={() => textareaRef.current?.focus()}
      >
        <PromptInput
          className="bg-black text-white relative z-10 p-0 pt-1 shadow-xs backdrop-blur-xl border-white/20"
          maxHeight={200}
          value={value}
          onValueChange={onValueChange}
        >
          <FileList files={files} onFileRemove={onFileRemove} />
          <PromptInputTextarea
            ref={textareaRef}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
            aria-invalid={isErrored}
            aria-describedby={errorMessageId}
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
          </PromptInputActions>
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
