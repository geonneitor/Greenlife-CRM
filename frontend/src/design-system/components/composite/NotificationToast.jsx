import { motion, AnimatePresence } from 'framer-motion'
import { colors, spacing, radius, shadows } from '@/design-system/tokens'

/**
 * Toast notification con animación slide-in
 */
export const NotificationToast = ({
    message,
    type = 'success',
    isVisible,
    onClose,
    duration = 4000,
}) => {
    // Auto-close después de duration
    React.useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, duration)
            return () => clearTimeout(timer)
        }
    }, [isVisible, duration, onClose])

    const typeStyles = {
        success: { bg: colors.status.success, icon: '✓' },
        error: { bg: colors.status.error, icon: '✕' },
        warning: { bg: colors.status.warning, icon: '⚠' },
        info: { bg: colors.status.info, icon: 'ℹ' },
    }

    const style = typeStyles[type]

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    style={{
                        position: 'fixed',
                        bottom: spacing.lg,
                        right: spacing.lg,
                        backgroundColor: style.bg,
                        color: 'white',
                        padding: spacing.lg,
                        borderRadius: radius.lg,
                        boxShadow: shadows.lg,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.md,
                        zIndex: 100,
                    }}
                >
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {style.icon}
                    </span>
                    <span style={{ fontSize: '1rem' }}>{message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}