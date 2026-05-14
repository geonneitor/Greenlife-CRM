import { useDeviceType } from '@/design-system/hooks'
import { spacing } from '@/design-system/tokens'

/**
 * Grid que cambia columnas según device
 * Mobile: 1 columna
 * Tablet: 2 columnas
 * Desktop: cols prop (defecto 4)
 */
export const ResponsiveGrid = ({
    children,
    cols = 4,
    gap = spacing.md,
    ...props
}) => {
    const { isMobile, isTablet } = useDeviceType()

    const columns = isMobile ? 1 : isTablet ? 2 : cols

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap,
                ...props.style,
            }}
            {...props}
        >
            {children}
        </div>
    )
}