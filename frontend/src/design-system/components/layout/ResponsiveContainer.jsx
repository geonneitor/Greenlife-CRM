import { useDeviceType } from '@/design-system/hooks'
import { spacing } from '@/design-system/tokens'

/**
 * Container que adapta padding según device
 * Mobile: md spacing
 * Tablet: lg spacing
 * Desktop: xl spacing
 */
export const ResponsiveContainer = ({ children, ...props }) => {
    const { isMobile, isTablet } = useDeviceType()

    const padding = isMobile ? spacing.md : isTablet ? spacing.lg : spacing.xl

    return (
        <div
            style={{
                width: '100%',
                padding,
                maxWidth: '1440px',
                margin: '0 auto',
                ...props.style,
            }}
            {...props}
        >
            {children}
        </div>
    )
}