import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/design-system/components/base/Button'

describe('Button Component', () => {
    it('renders with children', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('handles click events', () => {
        const handleClick = vi.fn()
        render(<Button onClick={handleClick}>Click</Button>)

        fireEvent.click(screen.getByRole('button'))
        expect(handleClick).toHaveBeenCalledOnce()
    })

    it('disables when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies correct variant', () => {
        const { container } = render(<Button variant="primary">Test</Button>)
        const button = container.querySelector('button')
        // El componente usa CSS variables para soportar temas dinámicos
        expect(button).toBeInTheDocument()
        expect(button.style.background).toContain('var(--brand')
    })
})