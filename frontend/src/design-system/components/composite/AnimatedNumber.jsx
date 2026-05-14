import { useState, useEffect, useRef } from 'react'

/**
 * Número que "cuenta" animadamente desde 0 hasta el valor target.
 * No depende de Framer Motion, usa requestAnimationFrame puro.
 */
export const AnimatedNumber = ({ value = 0, decimals = 2, duration = 1000 }) => {
    const [display, setDisplay] = useState(0)
    const startRef = useRef(null)
    const startValueRef = useRef(0)

    useEffect(() => {
        startValueRef.current = display
        startRef.current = null

        const animate = (timestamp) => {
            if (!startRef.current) startRef.current = timestamp
            const elapsed = timestamp - startRef.current
            const progress = Math.min(elapsed / duration, 1)
            // Easing: ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = startValueRef.current + (value - startValueRef.current) * eased
            setDisplay(current)
            if (progress < 1) requestAnimationFrame(animate)
        }

        requestAnimationFrame(animate)
    }, [value, duration])

    return <span>{display.toFixed(decimals)}</span>
}