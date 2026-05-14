import { motion } from 'framer-motion'
import { colors, spacing, radius, shadows } from '@/design-system/tokens'

/**
 * Card con animaciones de hover
 * - Scale en hover
 * - Cambio de sombra
 * - Glow del brand color
 */
export const AnimatedCard = ({
    children,
    onClick,
    elevated = false,
    glow = false,
    ...props
}) => {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={onClick}
            style={{
                background: colors.surface.elevated,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radius.lg,
                padding: spacing.lg,
                cursor: onClick ? 'pointer' : 'default',
                boxShadow: glow ? shadows.brandGlow : shadows.md,
                transition: 'box-shadow 250ms',
                ...props.style,
            }}
            {...props}
        >
            {children}
        </motion.div>
    )
}
