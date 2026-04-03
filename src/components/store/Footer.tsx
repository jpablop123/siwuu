import Link from 'next/link'
import { Mail, Phone, MapPin, Globe, MessageCircle } from 'lucide-react'

const TIENDA_LINKS = [
  { label: 'Todos los productos', href: '/productos' },
  { label: 'Categorías', href: '/#categorias' },
  { label: 'Destacados', href: '/productos?destacado=true' },
] as const

const CUENTA_LINKS = [
  { label: 'Mi perfil', href: '/cuenta' },
  { label: 'Mis pedidos', href: '/cuenta/pedidos' },
  { label: 'Carrito', href: '/carrito' },
  { label: 'Iniciar sesión', href: '/login' },
] as const

const METODOS_PAGO = ['Visa', 'Mastercard', 'PSE', 'Nequi', 'Bancolombia'] as const

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-emerald-500/30 bg-emerald-500/10 font-mono text-sm font-black text-emerald-400">
                S
              </div>
              <span className="font-heading text-lg font-extrabold text-zinc-900 dark:text-white">
                Siwu<span className="text-emerald-400">u</span>Shop
              </span>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-emerald-400/70">
              Shop it with us
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              Tu tienda online con los mejores productos tech y envío a toda Colombia.
            </p>
            {/* Redes sociales */}
            <div className="mt-5 flex gap-3">
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-600 transition-colors hover:border-emerald-500/50 hover:text-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://siwuushop.co"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-600 transition-colors hover:border-emerald-500/50 hover:text-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                aria-label="Sitio web"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Tienda
            </h4>
            <ul className="space-y-3">
              {TIENDA_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm transition-colors hover:text-emerald-400">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mi cuenta */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Mi cuenta
            </h4>
            <ul className="space-y-3">
              {CUENTA_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm transition-colors hover:text-emerald-400">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Métodos de pago */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Medios de pago
            </h4>
            <div className="flex flex-wrap gap-2">
              {METODOS_PAGO.map((m) => (
                <span
                  key={m}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {m}
                </span>
              ))}
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Wompi
              </span>
            </div>
            <div className="mt-6">
              <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Contacto
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
                  info@siwuushop.co
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
                  +57 300 123 4567
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
                  Bogotá, Colombia
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-zinc-200 pt-8 text-center dark:border-zinc-700">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
            &copy; {new Date().getFullYear()} SiwuuShop. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
