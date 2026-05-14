import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, spacing, zIndex } from '@/design-system/tokens'

/**
 * Panel que sube desde abajo (típico en móviles)
 * Se abre en móvil, se convierte en sidebar en desktop
 */
export const SlideUpPanel = ({ isOpen, onClose, children, title }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            zIndex: zIndex.overlay,
                        }}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30 }}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            maxHeight: '80vh',
                            backgroundColor: colors.surface.elevated,
                            borderTopLeftRadius: '16px',
                            borderTopRightRadius: '16px',
                            zIndex: zIndex.modal,
                            overflow: 'auto',
                        }}
                    >
                        {/* Handle bar */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                padding: spacing.md,
                                borderBottom: `1px solid ${colors.border.subtle}`,
                            }}
                        >
                            <div
                                style={{
                                    width: '40px',
                                    height: '4px',
                                    backgroundColor: colors.border.default,
                                    borderRadius: '2px',
                                }}
                            />
                        </div>

                        {/* Header */}
                        {title && (
                            <div style={{ padding: spacing.lg, borderBottom: `1px solid ${colors.border.subtle}` }}>
                                <h2 style={{ margin: 0, color: colors.text.primary }}>{title}</h2>
                            </div>
                        )}

                        {/* Content */}
                        <div style={{ padding: spacing.lg }}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}