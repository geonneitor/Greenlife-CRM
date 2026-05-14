import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, spacing, radius, zIndex } from '@/design-system/tokens'

/**
 * Bottom navigation para móviles
 * Se esconde en tablet/desktop (lg:hidden en Tailwind)
 */
export const MobileBottomNav = ({ items }) => {
    const [active, setActive] = useState(items[0]?.path)
    const navigate = useNavigate()

    const handleNavClick = (path) => {
        setActive(path)
        navigate(path)
    }

    return (
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                backgroundColor: colors.surface.base,
                borderTop: `1px solid ${colors.border.subtle}`,
                zIndex: zIndex.sticky,
                height: '64px',
                // Responsive: hidden en desktop
                '@media (min-width: 1024px)': {
                    display: 'none',
                },
            }}
        >
            {items.map((item) => (
                <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing.xs,
                        padding: spacing.md,
                        backgroundColor: active === item.path ? colors.surface.elevated : 'transparent',
                        color: active === item.path ? colors.brand : colors.text.secondary,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 250ms',
                        fontSize: '0.75rem',
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    )
}