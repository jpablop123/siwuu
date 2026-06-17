import { Home, Plane, ShieldCheck, MessageCircle } from 'lucide-react'

/** Config editable desde el admin (tienda_configuracion). Todo opcional → defaults. */
export interface FeaturesConfig {
  feature_1_titulo?: string | null
  feature_1_desc?: string | null
  feature_2_titulo?: string | null
  feature_2_desc?: string | null
  feature_3_titulo?: string | null
  feature_3_desc?: string | null
  feature_4_titulo?: string | null
  feature_4_desc?: string | null
}

const ICONS = [Home, Plane, ShieldCheck, MessageCircle]
const DEFAULTS = [
  { titulo: 'Entrega en la puerta de tu casa', desc: 'Te lo llevamos a domicilio en cualquier ciudad de Colombia.' },
  { titulo: 'Directo desde USA', desc: 'Tu personal shopper compra en Estados Unidos y lo trae por ti.' },
  { titulo: 'Pago 100% protegido', desc: 'Procesamos con Wompi — la plataforma más segura de Colombia.' },
  { titulo: 'Soporte local', desc: 'Atención en español, respuesta en menos de 24 h.' },
]

export function FeaturesBar({ config }: { config?: FeaturesConfig | null }) {
  const FEATURES = DEFAULTS.map((d, i) => ({
    Icon: ICONS[i],
    titulo: (config?.[`feature_${i + 1}_titulo` as keyof FeaturesConfig] as string) || d.titulo,
    desc: (config?.[`feature_${i + 1}_desc` as keyof FeaturesConfig] as string) || d.desc,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  }))

  return (
    <section
      className="border-y border-zinc-200 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950 sm:py-14"
      aria-label="Por qué comprarnos"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado centrado — solo desktop */}
        <p className="mb-8 hidden text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 lg:block">
          Por qué elegirnos
        </p>

        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {FEATURES.map(({ Icon, titulo, desc, color, bg }) => (
            <div
              key={titulo}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 transition-all duration-300 hover:border-zinc-200 hover:shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:hover:border-zinc-700 sm:flex-row sm:items-start sm:gap-4 sm:p-5"
            >
              {/* Ícono */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${bg}`}
                aria-hidden="true"
              >
                <Icon className={`h-5 w-5 ${color}`} />
              </div>

              {/* Texto */}
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 sm:text-base">
                  {titulo}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
