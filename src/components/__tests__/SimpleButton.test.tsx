import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Simple button component for testing
const SimpleButton = ({ children, onClick, disabled }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) => (
  <button onClick={onClick} disabled={disabled}>
    {children}
  </button>
)

describe('SimpleButton Component', () => {
  it('renders button with text', () => {
    render(<SimpleButton>Click me</SimpleButton>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<SimpleButton onClick={handleClick}>Click me</SimpleButton>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<SimpleButton disabled>Disabled</SimpleButton>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<SimpleButton onClick={handleClick} disabled>Disabled</SimpleButton>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})