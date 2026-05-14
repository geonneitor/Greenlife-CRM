import { useCallback, useState, useEffect } from 'react'

export const useTheme = () => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark'
    })

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }, [])

    return { theme, toggleTheme, isDark: theme === 'dark' }
}

export const useDeviceType = () => {
    const [deviceType, setDeviceType] = useState(() => {
        if (typeof window === 'undefined') return 'desktop'
        if (window.innerWidth < 768) return 'mobile'
        if (window.innerWidth < 1024) return 'tablet'
        return 'desktop'
    })

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setDeviceType('mobile')
            else if (window.innerWidth < 1024) setDeviceType('tablet')
            else setDeviceType('desktop')
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return {
        deviceType,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
    }
}

export const useAnimatedNumber = (target, duration = 1000) => {
    const [value, setValue] = useState(0)

    useEffect(() => {
        const increment = target / (duration / 16)
        const timer = setInterval(() => {
            setValue(prev => {
                const next = prev + increment
                return next >= target ? target : next
            })
        }, 16)

        return () => clearInterval(timer)
    }, [target, duration])

    return value
}