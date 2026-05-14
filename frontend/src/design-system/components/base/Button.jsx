import { forwardRef } from 'react'
import { colors, spacing, radius, animation } from "../../tokens";
export const Button = forwardRef(function Button(
    {
        children,
        variant = 'primary',
        size = 'md',
        disabled = false,
        onClick,
        style = {},
        ...props
    },
    ref
) {
    const variantStyles = {
        primary: { bg: colors.brand, text: '#000', hover: colors.brandDark },
        secondary: { bg: colors.surface.elevated, text: colors.text.primary, hover: colors.surface.hover },
    }

    const sizeStyles = {
        sm: { padding: `${spacing.sm} ${spacing.md}`, fontSize: '0.875rem' },
        md: { padding: `${spacing.md} ${spacing.lg}`, fontSize: '1rem' },
        lg: { padding: `${spacing.lg} ${spacing.xl}`, fontSize: '1.125rem' },
    }

    const style_variant = variantStyles[variant]
    const style_size = sizeStyles[size]

    return (
        <button
            ref={ref}
            onClick={onClick}
            disabled={disabled}
            style={{
                background: style_variant.bg,
                color: style_variant.text,
                padding: style_size.padding,
                fontSize: style_size.fontSize,
                border: 'none',
                borderRadius: radius.lg,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: `all ${animation.normal}`,
                fontWeight: 600,
                ...style,
            }}
            {...props}
        >
            {children}
        </button>
    )
})