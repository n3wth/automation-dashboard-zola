import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

// Mock the chat input component (adapt path as needed)
const ChatInput = ({ onSend, placeholder = "Type a message..." }: {
  onSend?: (message: string) => void
  placeholder?: string
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const message = formData.get('message') as string
    if (message.trim() && onSend) {
      onSend(message.trim())
      e.currentTarget.reset()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        name="message"
        placeholder={placeholder}
        rows={1}
      />
      <button type="submit">Send</button>
    </form>
  )
}

describe('ChatInput Component', () => {
  it('renders textarea and send button', () => {
    render(<ChatInput />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('shows placeholder text', () => {
    const placeholder = 'Enter your message...'
    render(<ChatInput placeholder={placeholder} />)

    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument()
  })

  it('calls onSend when form is submitted with message', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)

    const textarea = screen.getByRole('textbox')
    const sendButton = screen.getByRole('button', { name: 'Send' })

    await user.type(textarea, 'Hello, world!')
    await user.click(sendButton)

    expect(onSend).toHaveBeenCalledWith('Hello, world!')
  })

  it('clears textarea after sending message', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)

    const textarea = screen.getByRole('textbox')
    const sendButton = screen.getByRole('button', { name: 'Send' })

    await user.type(textarea, 'Test message')
    await user.click(sendButton)

    expect(textarea).toHaveValue('')
  })

  it('does not call onSend with empty message', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)

    const sendButton = screen.getByRole('button', { name: 'Send' })
    await user.click(sendButton)

    expect(onSend).not.toHaveBeenCalled()
  })

  it('trims whitespace from messages', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)

    const textarea = screen.getByRole('textbox')
    const sendButton = screen.getByRole('button', { name: 'Send' })

    await user.type(textarea, '  Hello  ')
    await user.click(sendButton)

    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('handles Enter key submission', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)

    const textarea = screen.getByRole('textbox')

    await user.type(textarea, 'Enter submission test')
    await user.keyboard('{Enter}')

    expect(onSend).toHaveBeenCalledWith('Enter submission test')
  })
})