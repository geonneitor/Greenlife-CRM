import { motion } from 'framer-motion'
import { AnimatedNumber } from './AnimatedNumber'
import { colors, spacing, radius } from '@/design-system/tokens'

export const CommissionDisplay = ({ commission = 0, breakdown = {} }) => {
    const getColor = (amount) => {
        if (amount >= 1000) return colors.status.success
        if (amount >= 500) return colors.brand
        if (amount >= 100) return colors.status.warning
        return colors.text.secondary
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
                backgroundColor: colors.surface.elevated,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radius.lg,
                padding: spacing.lg,
            }}
        >
            <p style={{ margin: 0, color: colors.text.secondary, fontSize: '0.875rem' }}>
                Comisión Ganada
            </p>
            <p style={{ margin: `${spacing.md} 0 0 0`, fontSize: '2.5rem', fontWeight: 900, color: getColor(commission) }}>
                $<AnimatedNumber value={commission} decimals={2} duration={1500} />
            </p>

            {Object.entries(breakdown).length > 0 && (
                <div style={{ marginTop: spacing.lg, paddingTop: spacing.lg, borderTop: `1px solid ${colors.border.subtle}` }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: colors.text.secondary, marginBottom: spacing.sm }}>
                        Desglose:
                    </p>
                    {Object.entries(breakdown).map(([tier, amount]) => (
                        <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs, fontSize: '0.875rem' }}>
                            <span style={{ color: colors.text.secondary }}>{tier}:</span>
                            <span style={{ color: colors.brand, fontWeight: 600 }}>${amount.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}