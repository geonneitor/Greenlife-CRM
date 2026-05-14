import { motion, AnimatePresence } from 'framer-motion'
import { colors, spacing, radius, shadows, zIndex } from '@/design-system/tokens'

export const SalesSummaryModal = ({ isOpen, items = [], total = 0, commission = 0, onConfirm, onCancel }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            zIndex: zIndex.overlay,
                        }}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25 }}
                        style={{
                            position: 'fixed', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: colors.surface.elevated,
                            borderRadius: radius.lg,
                            padding: spacing.xl,
                            boxShadow: shadows.xl,
                            zIndex: zIndex.modal,
                            maxWidth: '500px',
                            width: '90vw',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                        }}
                    >
                        <h2 style={{ margin: 0, marginBottom: spacing.lg, color: colors.text.primary }}>
                            ✓ Confirmar Venta
                        </h2>

                        <div style={{ marginBottom: spacing.lg }}>
                            <p style={{ color: colors.text.secondary, fontSize: '0.875rem', marginBottom: spacing.md }}>
                                {items.length} producto(s)
                            </p>
                            {items.map((item) => (
                                <div key={item.product_id} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    paddingBottom: spacing.md,
                                    borderBottom: `1px solid ${colors.border.subtle}`,
                                    marginBottom: spacing.md,
                                }}>
                                    <div>
                                        <p style={{ margin: 0, color: colors.text.primary }}>{item.product_name}</p>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: colors.text.secondary }}>
                                            {item.quantity} × ${item.price_at_sale.toFixed(2)}
                                        </p>
                                    </div>
                                    <span style={{ color: colors.brand, fontWeight: 600 }}>
                                        ${(item.quantity * item.price_at_sale).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            marginBottom: spacing.lg, padding: `${spacing.lg} ${spacing.md}`,
                            backgroundColor: colors.surface.base, borderRadius: radius.md
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.md }}>
                                <span style={{ color: colors.text.secondary }}>Total Venta:</span>
                                <span style={{ color: colors.text.primary, fontWeight: 600 }}>${total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: colors.text.secondary }}>Tu Comisión:</span>
                                <span style={{ color: colors.brand, fontWeight: 700, fontSize: '1.1rem' }}>${commission.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
                            <motion.button
                                whileHover={{ backgroundColor: colors.surface.hover }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onCancel}
                                style={{
                                    padding: spacing.lg, backgroundColor: colors.surface.base, color: colors.text.primary,
                                    border: `1px solid ${colors.border.default}`, borderRadius: radius.md, cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                Cancelar
                            </motion.button>
                            <motion.button
                                whileHover={{ backgroundColor: colors.brandDark }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onConfirm}
                                style={{
                                    padding: spacing.lg, backgroundColor: colors.brand, color: colors.text.inverse,
                                    border: 'none', borderRadius: radius.md, cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem'
                                }}
                            >
                                💰 Cobrar
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}