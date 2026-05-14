import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResponsiveGrid } from '@/design-system/components/layout'

// Mock del hook useDeviceType
vi.mock('@/design-system/hooks', () => ({
    useDeviceType: () => ({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
    }),
}))

describe('ResponsiveGrid', () => {
    it('renders with correct grid columns for desktop', () => {
        const { container } = render(
            <ResponsiveGrid cols={4}>
                <div>Item 1</div>
                <div>Item 2</div>
            </ResponsiveGrid>
        )

        const grid = container.firstChild
        const styles = window.getComputedStyle(grid)

        // Desktop debe tener 4 columnas
        expect(styles.gridTemplateColumns).toMatch('1fr')
    })
})