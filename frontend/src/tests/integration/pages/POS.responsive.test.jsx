import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import POS from '@/pages/POS'

// Mock hooks de device
vi.mock('@/design-system/hooks', () => ({
    useDeviceType: () => ({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
    }),
}))

// Mock useProducts — el POS carga datos del API real, en tests usamos datos fijos
vi.mock('@/hooks/useProducts', () => ({
    useProducts: () => ({
        products: [
            {
                id: 1,
                name: 'Super Lemon Haze',
                category: 'Flor',
                price_retail: 200,
                unit_type: 'weight',
                stock: 50,
                restock_alert: 10,
                inStock: true,
                pricing_tiers: [],
            },
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
    }),
}))

// Mock useSales
vi.mock('@/hooks/useSales', () => ({
    useSales: () => ({
        createSale: vi.fn(),
        sales: [],
        loading: false,
    }),
}))

describe('POS Page - Responsive', () => {
    beforeEach(() => {
        render(
            <BrowserRouter>
                <POS />
            </BrowserRouter>
        )
    })

    it('renders buscador de productos', () => {
        expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument()
    })

    it('renders categoria Todos por defecto', () => {
        expect(screen.getByRole('button', { name: /Todos/i })).toBeInTheDocument()
    })

    it('renders categoria del producto mockeado', () => {
        expect(screen.getByRole('button', { name: /Flor/i })).toBeInTheDocument()
    })

    it('renders products en el grid', () => {
        expect(screen.getByText('Super Lemon Haze')).toBeInTheDocument()
    })

    it('renders el sidebar del carrito en desktop', () => {
        expect(screen.getByText('Carrito vacío')).toBeInTheDocument()
    })
})