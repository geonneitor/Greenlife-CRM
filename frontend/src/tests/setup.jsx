import '@testing-library/jest-dom'

// Mock de Framer Motion — CRÍTICO para tests
// Sin esto, los componentes animados fallan por no tener un DOM real con animaciones
const filterMotionProps = (props) => {
    const {
        whileHover,
        whileTap,
        layout,
        initial,
        animate,
        exit,
        transition,
        variants,
        onAnimationStart,
        onAnimationComplete,
        onUpdate,
        ...rest
    } = props;
    return rest;
};

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...filterMotionProps(props)}>{children}</div>,
        button: ({ children, ...props }) => <button {...filterMotionProps(props)}>{children}</button>,
        p: ({ children, ...props }) => <p {...filterMotionProps(props)}>{children}</p>,
        span: ({ children, ...props }) => <span {...filterMotionProps(props)}>{children}</span>,
        nav: ({ children, ...props }) => <nav {...filterMotionProps(props)}>{children}</nav>,
        header: ({ children, ...props }) => <header {...filterMotionProps(props)}>{children}</header>,
        footer: ({ children, ...props }) => <footer {...filterMotionProps(props)}>{children}</footer>,
        section: ({ children, ...props }) => <section {...filterMotionProps(props)}>{children}</section>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
    useSpring: () => ({ number: { to: (fn) => fn(0) } }),
    useScroll: () => ({ scrollY: { onChange: () => { } } }),
    useTransform: () => ({ }),
}))