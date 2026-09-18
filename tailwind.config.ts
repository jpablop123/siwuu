import type { Config } from "tailwindcss";

/**
 * Sistema de diseño Siwuu — dirección "Aduana sobre blanco".
 *
 * Marca: operación de importación transparente. Blanco y hueso como fondo,
 * tinta azulada para el texto, azul señal para acciones y naranja aduana para
 * todo lo que habla de importación (sellos, estados de envío, destacados).
 *
 * Capa de compatibilidad
 * ----------------------
 * La tienda se construyó con `emerald-*`, `amber-*` y `zinc-*` escritos a mano
 * en decenas de componentes. En vez de reescribir cada clase (y arriesgar
 * romper pantallas del admin), acá se REDEFINEN esas tres escalas con los
 * colores de marca:
 *
 *   emerald-*  →  azul señal   (acciones, enlaces, foco)
 *   amber-*    →  naranja aduana (sellos, importación, descuentos)
 *   zinc-*     →  tinta azulada (neutros)
 *
 * Así toda la app adopta la identidad de inmediato y los componentes nuevos ya
 * usan los nombres correctos: `brand-*`, `aduana-*` e `ink-*`.
 */

const brand = {
  50:  '#EEF3FE',
  100: '#D9E4FD',
  200: '#B4C8FB',
  300: '#7FA1F6',
  400: '#4574EC',
  500: '#0F4CD8',   // azul señal — el color de las acciones
  600: '#0B3CB0',
  700: '#0A3190',
  800: '#0B2A76',
  900: '#0C2560',
  950: '#071640',
};

const aduana = {
  50:  '#FFF3EB',
  100: '#FFE2CC',
  200: '#FFC49A',
  300: '#FFA15F',
  400: '#FF8433',
  500: '#FF6A00',   // naranja aduana — importación, sellos, estados
  600: '#DB5400',
  700: '#B34300',
  800: '#8A3400',
  900: '#6B2900',
  950: '#3D1700',
};

/** Neutros con sesgo azul: sobre blanco se leen fríos, nunca sucios. */
const ink = {
  50:  '#F7F8FA',
  100: '#EFF1F4',
  200: '#E2E5EA',
  300: '#CBD1D9',
  400: '#97A1AE',
  500: '#6B7482',
  600: '#4C5563',
  700: '#363E4B',
  800: '#222933',
  900: '#161C24',
  950: '#0B0F14',
};

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand,
        aduana,
        ink,

        // Capa de compatibilidad — ver nota de arriba
        emerald: brand,
        amber: aduana,
        zinc: ink,

        primary: {
          ...brand,
          DEFAULT: brand[500],
          foreground: '#FFFFFF',
        },
        accent: {
          ...aduana,
          DEFAULT: aduana[500],
          foreground: '#FFFFFF',
        },
        hueso: '#F6F5F2',        // fondo alterno de secciones
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        DEFAULT: '0.5rem',
        'md': '0.625rem',
        'lg': '0.875rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        'full': '9999px',
      },
      boxShadow: {
        // Sombras de papel: nada de glows de neón.
        'card': '0 1px 2px 0 rgba(16,20,24,0.05), 0 0 0 1px rgba(16,20,24,0.06)',
        'card-dark': '0 2px 8px 0 rgba(0,0,0,0.35), 0 0 0 1px rgba(54,62,75,0.6)',
        'card-hover': '0 8px 24px -6px rgba(16,20,24,0.14), 0 0 0 1px rgba(15,76,216,0.25)',
        'lift': '0 12px 32px -10px rgba(16,20,24,0.20)',
        'button': '0 1px 2px 0 rgba(11,40,100,0.25)',
        'glow': '0 0 0 4px rgba(15,76,216,0.12)',
        'glow-lg': '0 10px 30px -8px rgba(15,76,216,0.35)',
        'glow-amber': '0 0 0 4px rgba(255,106,0,0.14)',
        'glow-violet': '0 0 0 4px rgba(15,76,216,0.12)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
        'glow-pulse': 'pulseSoft 2s ease-in-out infinite',
        'marquee': 'marquee 38s linear infinite',
        'route': 'route 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        // Marquee de tiendas de USA
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // El punto que recorre la barra de estado del envío
        route: {
          '0%':   { transform: 'translateX(0)', opacity: '0.4' },
          '50%':  { opacity: '1' },
          '100%': { transform: 'translateX(var(--route-distance, 100%))', opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
