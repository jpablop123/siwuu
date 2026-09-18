import { TIENDAS_USA } from '@/lib/brand'

/**
 * Cinta de tiendas de Estados Unidos en las que compramos por encargo.
 *
 * Se escriben como texto, no con sus logotipos: son marcas de terceros y no
 * queremos dar a entender que hay una alianza comercial con ellas.
 */
export function StoresMarquee() {
  const tiendas = [...TIENDAS_USA, ...TIENDAS_USA] // duplicado para el loop continuo

  return (
    <section className="border-y border-ink-200 bg-white py-8 dark:border-ink-800 dark:bg-ink-950">
      <p className="px-4 text-center text-sm text-ink-500 dark:text-ink-400">
        Te traemos lo que compres en las tiendas más grandes de Estados Unidos
      </p>

      <div
        className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        aria-hidden="true"
      >
        <div className="flex w-max animate-marquee items-center gap-10 pr-10 motion-reduce:animate-none">
          {tiendas.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="whitespace-nowrap font-heading text-xl font-bold text-ink-400 sm:text-2xl dark:text-ink-600"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Versión accesible del listado, sin animación */}
      <p className="sr-only">
        Compramos por encargo en {TIENDAS_USA.join(', ')} y en cualquier otra tienda de Estados Unidos.
      </p>
    </section>
  )
}
