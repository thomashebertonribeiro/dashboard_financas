/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Space Grotesk', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                bg: '#0a0f1e',
                surface: '#111827',
                card: '#151e2d',
                border: '#1e2d45',
                accent: '#00d4aa',
                'accent-dim': '#00d4aa22',
                danger: '#ff4d6d',
                'danger-dim': '#ff4d6d22',
                warning: '#fbbf24',
                'warning-dim': '#fbbf2422',
                info: '#60a5fa',
                'info-dim': '#60a5fa22',
                muted: '#4b5a6e',
                subtle: '#8899aa',
            },
        },
    },
    plugins: [],
}

