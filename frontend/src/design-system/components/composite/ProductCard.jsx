import { motion } from 'framer-motion'
import { useState } from 'react'
import { colors, spacing, radius, shadows } from '@/design-system/tokens'

export const ProductCard = ({ product, onAddToCart, variant = 'compact' }) => {
    const [showTiers, setShowTiers] = useState(false)

    const stockStatus =
        product.stock > product.restock_alert ? 'ok' :
            product.stock > 0 ? 'low' : 'out'

    const stockColors = {
        ok: colors.status.success,
        low: colors.status.warning,
        out: colors.status.error,
    }

    if (variant === 'compact') {
        return (
            <motion.div
                whileHover={{ scale: 1.05, boxShadow: shadows.lg }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', damping: 20 }}
                style={{
                    backgroundColor: colors.surface.elevated,
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    cursor: 'pointer',
                    position: 'relative',
                }}
            >
                {/* Indicador de stock */}
                <div
                    style={{
                        position: 'absolute',
                        top: spacing.md,
                        right: spacing.md,
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: stockColors[stockStatus],
                    }}
                />

                <h3 style={{ margin: `0 0 ${spacing.sm} 0`, color: colors.text.primary }}>
                    {product.name}
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: colors.text.secondary }}>
                    {product.category}
                </p>
                <p style={{ margin: `${spacing.md} 0 0 0`, fontSize: '1.5rem', fontWeight: 900, color: colors.brand }}>
                    ${product.price_retail.toFixed(2)}
                </p>

                <motion.button
                    whileHover={{ backgroundColor: colors.brandDark }}
                    onClick={() => onAddToCart(product, 1, product.price_retail)}
                    style={{
                        width: '100%',
                        padding: spacing.md,
                        marginTop: spacing.lg,
                        backgroundColor: colors.brand,
                        color: colors.text.inverse,
                        border: 'none',
                        borderRadius: radius.md,
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    Agregar
                </motion.button>

                {product.is_cannabis_type && (
                    <div style={{ marginTop: spacing.md }}>
                        <button
                            onClick={() => setShowTiers(!showTiers)}
                            style={{
                                background: 'none',
                                border: `1px solid ${colors.border.default}`,
                                borderRadius: radius.sm,
                                color: colors.text.secondary,
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                padding: `${spacing.xs} ${spacing.sm}`,
                                width: '100%',
                            }}
                        >
                            {showTiers ? '▲ Ocultar tiers' : '▼ Ver tiers'}
                        </button>

                        {showTiers && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.sm, marginTop: spacing.sm }}>
                                {product.price_1g > 0 && (
                                    <button onClick={() => onAddToCart(product, 1, product.price_1g)}
                                        style={{
                                            padding: spacing.sm, fontSize: '0.75rem', backgroundColor: colors.surface.hover,
                                            border: `1px solid ${colors.border.default}`, borderRadius: radius.sm,
                                            color: colors.text.primary, cursor: 'pointer'
                                        }}>
                                        1g ${product.price_1g}
                                    </button>
                                )}
                                {product.price_14g > 0 && (
                                    <button onClick={() => onAddToCart(product, 14, product.price_14g)}
                                        style={{
                                            padding: spacing.sm, fontSize: '0.75rem', backgroundColor: colors.surface.hover,
                                            border: `1px solid ${colors.border.default}`, borderRadius: radius.sm,
                                            color: colors.text.primary, cursor: 'pointer'
                                        }}>
                                        14g ${product.price_14g}
                                    </button>
                                )}
                                {product.price_28g > 0 && (
                                    <button onClick={() => onAddToCart(product, 28, product.price_28g)}
                                        style={{
                                            padding: spacing.sm, fontSize: '0.75rem', backgroundColor: colors.surface.hover,
                                            border: `1px solid ${colors.border.default}`, borderRadius: radius.sm,
                                            color: colors.text.primary, cursor: 'pointer'
                                        }}>
                                        28g ${product.price_28g}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        )
    }

    // Variant: detailed
    return (
        <div style={{ padding: spacing.lg }}>
            <h2 style={{ margin: 0, marginBottom: spacing.md, color: colors.text.primary }}>
                {product.name}
            </h2>
            <p style={{ color: colors.text.secondary }}>Categoría: {product.category}</p>
            <p style={{ color: colors.text.secondary }}>Stock: {product.stock} unidades</p>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: colors.brand, margin: 0 }}>
                ${product.price_retail.toFixed(2)}
            </p>
        </div>
    )
}