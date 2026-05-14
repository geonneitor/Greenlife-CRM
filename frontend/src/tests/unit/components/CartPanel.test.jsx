import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { CartPanel } from '@/design-system/components/composite/CartPanel'

const mockItems = [
    { product_id: 1, product_name: 'Super Lemon Haze', quantity: 1, price_at_sale: 200 },
]

describe('CartPanel', () => {
    it('muestra mensaje de carrito vacío', () => {
        const { getByText } = render(<CartPanel items={[]} />)
        expect(getByText('Carrito vacío')).toBeInTheDocument()
    })

    it('muestra items del carrito', () => {
        const { getByText } = render(
            <CartPanel items={mockItems} total={200} commission={50}
                onRemoveItem={() => { }} onUpdateQuantity={() => { }} onCheckout={() => { }} />
        )
        expect(getByText('Super Lemon Haze')).toBeInTheDocument()
    })

    it('llama a onCheckout al cobrar', () => {
        const mockCheckout = vi.fn()
        const { getByText } = render(
            <CartPanel items={mockItems} total={200} commission={50}
                onRemoveItem={() => { }} onUpdateQuantity={() => { }} onCheckout={mockCheckout} />
        )
        fireEvent.click(getByText(/Cobrar/))
        expect(mockCheckout).toHaveBeenCalled()
    })

    it('llama a onUpdateQuantity al presionar +', () => {
        const mockUpdate = vi.fn()
        render(
            <CartPanel items={mockItems} total={200} commission={50}
                onRemoveItem={() => { }} onUpdateQuantity={mockUpdate} onCheckout={() => { }} />
        )
        // Los botones usan iconos SVG (Lucide), no texto plano
        // Orden: [quitar, menos, más, cobrar] — el botón + es índice 2
        const buttons = screen.getAllByRole('button')
        const plusBtn = buttons[2]
        fireEvent.click(plusBtn)
        expect(mockUpdate).toHaveBeenCalled()
    })

    it('llama a onRemoveItem al presionar el botón de eliminar', () => {
        const mockRemove = vi.fn()
        render(
            <CartPanel items={mockItems} total={200} commission={50}
                onRemoveItem={mockRemove} onUpdateQuantity={() => { }} onCheckout={() => { }} />
        )
        // El botón de eliminar (X) es el primero en el item
        const buttons = screen.getAllByRole('button')
        const removeBtn = buttons[0]
        fireEvent.click(removeBtn)
        expect(mockRemove).toHaveBeenCalled()
    })

    it('muestra total y comisión correctamente', () => {
        const { getAllByText, getByText } = render(
            <CartPanel items={mockItems} total={200} commission={80}
                onRemoveItem={() => { }} onUpdateQuantity={() => { }} onCheckout={() => { }} />
        )
        expect(getAllByText('$200.00').length).toBeGreaterThan(0)
        expect(getByText('$80.00')).toBeInTheDocument()
    })

})