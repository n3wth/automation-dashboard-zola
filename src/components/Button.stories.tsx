import type { Story } from '@ladle/react'
import { Button } from './ui/button'

export const Default: Story = () => <Button>Default Button</Button>

export const Variants: Story = () => (
  <div className="flex gap-4 flex-wrap">
    <Button variant="default">Default</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
)

export const Sizes: Story = () => (
  <div className="flex gap-4 items-center flex-wrap">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon">🚀</Button>
  </div>
)

export const States: Story = () => (
  <div className="flex gap-4 flex-wrap">
    <Button>Normal</Button>
    <Button disabled>Disabled</Button>
    <Button loading>Loading</Button>
  </div>
)

export const AsChild: Story = () => (
  <Button asChild>
    <a href="https://example.com" target="_blank" rel="noopener noreferrer">
      Link Button
    </a>
  </Button>
)

Default.meta = {
  title: 'UI/Button',
  description: 'A versatile button component with multiple variants and sizes.'
}