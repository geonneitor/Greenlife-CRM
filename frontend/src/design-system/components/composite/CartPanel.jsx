import { motion, AnimatePresence } from 'framer-motion'
import { colors, spacing, radius } from '@/design-system/tokens'
import { Minus, Plus, X, ShoppingCart } from 'lucide-react'

export const CartPanel = ({ items = [], onRemoveItem, onUpdateQuantity, onCheckout, total = 0, commission = 0 }) => {
    if (items.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: colors.text.muted, gap: spacing.sm }}>
                <ShoppingCart size={36} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '0.8125rem', margin: 0 }}>Carrito vacío</p>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>

            {/* Lista de items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                <AnimatePresence>
                    {items.map((item) => (
                        <motion.div
                            key={item.product_id}
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                padding: `${spacing.sm} ${spacing.md}`,
                                backgroundColor: 'rgba(0, 208, 132, 0.04)',
                                borderRadius: radius.md,
                                borderLeft: `2px solid ${colors.brand}`,
                            }}
                        >
                            {/* Nombre + borrar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ color: colors.text.primary, fontSize: '0.8125rem', fontWeight: 600, flex: 1 }}>
                                    {item.product_name}
                                </span>
                                <button onClick={() => onRemoveItem(item.product_id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.danger, padding: '2px', display: 'flex', lineHeight: 1 }}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Controles + precio */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                                <span style={{ color: colors.text.muted, fontSize: '0.75rem' }}>
                                    ${item.price_at_sale.toFixed(2)}
                                </span>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                                        style={{ width: '20px', height: '20px', borderRadius: '4px', border: `1px solid ${colors.border.default}`, background: colors.surface.base, color: colors.text.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Minus size={10} />
                                    </button>
                                    <span style={{ color: colors.text.primary, fontWeight: 700, fontSize: '0.8125rem', minWidth: '20px', textAlign: 'center' }}>
                                        {item.quantity}
                                    </span>
                                    <button onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                                        style={{ width: '20px', height: '20px', borderRadius: '4px', border: `1px solid ${colors.border.default}`, background: colors.surface.base, color: colors.text.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Plus size={10} />
                                    </button>
                                    <span style={{ color: colors.brand, fontWeight: 700, fontSize: '0.8125rem', minWidth: '52px', textAlign: 'right' }}>
                                        ${(item.quantity * item.price_at_sale).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Resumen */}
            <div style={{ borderTop: `1px solid ${colors.border.subtle}`, paddingTop: spacing.sm, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: colors.text.muted }}>
                    <span>Subtotal</span><span>${total.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: colors.text.secondary }}>
                    <span>Comisión (15%)</span><span>${commission.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, color: colors.text.primary, borderTop: `1px solid ${colors.border.subtle}`, paddingTop: '6px', marginTop: '2px' }}>
                    <span>Total</span>
                    <span style={{ color: colors.brand }}>${total.toFixed(2)}</span>
                </div>
            </div>

            {/* Botón cobrar */}
            <motion.button
                whileHover={{ scale: 1.02, brightness: 1.1 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCheckout}
                style={{
                    width: '100%',
                    padding: `${spacing.sm} ${spacing.md}`,
                    backgroundColor: colors.brand,
                    color: '#000',
                    border: 'none',
                    borderRadius: radius.md,
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                }}
            >
                Cobrar ${total.toFixed(2)}
            </motion.button>
        </div>
    )
}