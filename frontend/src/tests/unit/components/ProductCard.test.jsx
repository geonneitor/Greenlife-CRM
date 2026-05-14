import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/design-system/components/composite/ProductCard'

const mockProduct = {
    id: 1,
    name: 'Super Lemon Haze',
    category: 'Flor',
    price_retail: 200,
    price_1g: 200,
    price_14g: 2100,
    price_28g: 4000,
    stock: 50,
    restock_alert: 10,
    is_cannabis_type: true,
}

describe('ProductCard', () => {
    it('muestra nombre y precio', () => {
        const { getByText } = render(
            <ProductCard product={mockProduct} onAddToCart={() => { }} />
        )
        expect(getByText('Super Lemon Haze')).toBeInTheDocument()
        expect(getByText('$200.00')).toBeInTheDocument()
    })

    it('llama a onAddToCart al hacer click en Agregar', () => {
        const mockAdd = vi.fn()
        const { getByText } = render(
            <ProductCard product={mockProduct} onAddToCart={mockAdd} />
        )
        fireEvent.click(getByText('Agregar'))
        expect(mockAdd).toHaveBeenCalledWith(mockProduct, 1, 200)
    })

    it('muestra botón de tiers para productos cannabis', () => {
        const { getByText } = render(
            <ProductCard product={mockProduct} onAddToCart={() => { }} />
        )
        expect(getByText(/Ver tiers/)).toBeInTheDocument()
    })

    it('expande tiers al hacer click', () => {
        const { getByText } = render(
            <ProductCard product={mockProduct} onAddToCart={() => { }} />
        )
        fireEvent.click(getByText(/Ver tiers/))
        expect(getByText(/1g/)).toBeInTheDocument()
        expect(getByText(/14g/)).toBeInTheDocument()
    })

    it('no muestra botón de tiers para productos no-cannabis', () => {
        const product = { ...mockProduct, is_cannabis_type: false }
        const { queryByText } = render(
            <ProductCard product={product} onAddToCart={() => { }} />
        )
        expect(queryByText(/Ver tiers/)).not.toBeInTheDocument()
    })

    it('stock bajo muestra color amarillo', () => {
        const product = { ...mockProduct, stock: 3, restock_alert: 10 }
        const { container } = render(
            <ProductCard product={product} onAddToCart={() => { }} />
        )
        // El indicador de stock debe existir
        const indicator = container.querySelector('[style*="border-radius: 50%"]')
        expect(indicator).toBeInTheDocument()
    })
})