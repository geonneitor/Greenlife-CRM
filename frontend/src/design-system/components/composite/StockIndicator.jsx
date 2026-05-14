import { motion } from 'framer-motion'
import { colors, spacing, radius } from '@/design-system/tokens'

export const StockIndicator = ({ current = 0, threshold = 5, daysRemaining = null, trend = 'stable' }) => {
    const getStatus = () => {
        if (current === 0) return { color: colors.status.error, label: 'Sin stock' }
        if (current < threshold) return { color: colors.status.warning, label: 'Stock bajo' }
        return { color: colors.status.success, label: 'Stock normal' }
    }

    const { color, label } = getStatus()
    const trendIcon = { stable: '→', decreasing: '↘', increasing: '↗' }[trend]

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
                padding: spacing.md,
                backgroundColor: colors.surface.elevated,
                borderLeft: `4px solid ${color}`,
                borderRadius: radius.md,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ margin: 0, color: colors.text.secondary, fontSize: '0.875rem' }}>{label}</p>
                    <p style={{ margin: `${spacing.sm} 0 0 0`, fontSize: '1.5rem', fontWeight: 900, color }}>
                        {current} unidades
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2rem' }}>{trendIcon}</span>
                    {daysRemaining !== null && (
                        <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.text.secondary, fontSize: '0.875rem' }}>
                            ~{Math.round(daysRemaining)} días
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    )
}