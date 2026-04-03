import { resend, FROM_EMAIL, buildEmailBase, buildTablaItems } from './client'
import { formatCOP } from '@/lib/utils'

// ---------------------------------------------------------------------------
// EMAIL 1: Confirmación de pedido
// ---------------------------------------------------------------------------

export async function enviarEmailConfirmacionPedido(params: {
  email: string
  nombre: string
  numeroPedido: string
  items: Array<{
    nombre: string
    variante?: string | null
    cantidad: number
    precioUnitario: number
  }>
  subtotal: number
  costoEnvio: number
  total: number
  ciudad: string
  departamento: string
  direccionEnvio: string
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const envioTexto =
    params.costoEnvio === 0
      ? '<span style="color:#16a34a;font-weight:bold">Gratis \ud83c\udf89</span>'
      : formatCOP(params.costoEnvio)

  const contenido = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">
      \u00a1Hola ${params.nombre}! Tu pedido fue confirmado. \ud83c\udf89
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6">
      Recibimos tu pago y tu pedido <strong>#${params.numeroPedido}</strong> est\u00e1 siendo procesado.
    </p>

    ${buildTablaItems(params.items)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#6b7280">Subtotal</td>
        <td style="padding:6px 0;font-size:14px;color:#374151;text-align:right">${formatCOP(params.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#6b7280">Env\u00edo</td>
        <td style="padding:6px 0;font-size:14px;color:#374151;text-align:right">${envioTexto}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:8px 0 0;border-top:2px solid #e5e7eb"></td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:18px;color:#111827;font-weight:bold">Total</td>
        <td style="padding:6px 0;font-size:18px;color:#111827;font-weight:bold;text-align:right">${formatCOP(params.total)}</td>
      </tr>
    </table>

    <div style="background-color:#f9fafb;border-radius:8px;padding:16px;margin:24px 0">
      <p style="margin:0 0 4px;font-size:14px;font-weight:bold;color:#374151">
        Direcci\u00f3n de entrega:
      </p>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5">
        ${params.direccionEnvio}<br>
        ${params.ciudad}, ${params.departamento}
      </p>
    </div>

    <div style="text-align:center;margin:24px 0">
      <a href="${appUrl}/cuenta/pedidos" style="display:inline-block;background-color:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
        Ver mi pedido \u2192
      </a>
    </div>

    <p style="margin:0;font-size:14px;color:#6b7280;text-align:center">
      Te notificaremos cuando tu pedido sea despachado.
    </p>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `\u2705 Pedido ${params.numeroPedido} confirmado`,
      html: buildEmailBase({
        titulo: 'Pedido confirmado',
        preheader: `Tu pedido ${params.numeroPedido} fue confirmado. Total: ${formatCOP(params.total)}`,
        contenido,
      }),
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    console.error('Error enviando email de confirmaci\u00f3n:', msg)
    return { ok: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// EMAIL 2: Actualización de estado
// ---------------------------------------------------------------------------

const ESTADO_CONFIG: Record<string, { asunto: string; emoji: string; mensaje: string }> = {
  procesando: {
    asunto: 'Estamos preparando tu pedido',
    emoji: '\ud83d\udce6',
    mensaje: 'Estamos preparando tu pedido para enviarlo. En breve tendr\u00e1s m\u00e1s novedades.',
  },
  enviado_proveedor: {
    asunto: 'Tu pedido fue despachado',
    emoji: '\ud83d\ude80',
    mensaje: 'Tu pedido fue despachado y est\u00e1 en camino hacia vos.',
  },
  en_camino: {
    asunto: 'Tu pedido est\u00e1 en camino',
    emoji: '\ud83d\ude9a',
    mensaje: 'Tu pedido est\u00e1 en camino. Pronto llegar\u00e1 a tu puerta.',
  },
  entregado: {
    asunto: 'Tu pedido fue entregado',
    emoji: '\ud83c\udf89',
    mensaje: '\u00a1Tu pedido fue entregado! Esperamos que disfrutes tu compra.',
  },
  cancelado: {
    asunto: 'Tu pedido fue cancelado',
    emoji: '\u274c',
    mensaje: 'Lamentamos informarte que tu pedido fue cancelado. Si ten\u00e9s dudas, contactanos.',
  },
}

export async function enviarEmailActualizacionEstado(params: {
  email: string
  nombre: string
  numeroPedido: string
  nuevoEstado: string
  numeroGuia?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const config = ESTADO_CONFIG[params.nuevoEstado]
  if (!config) return { ok: true }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  let guiaHtml = ''
  if (params.numeroGuia && params.nuevoEstado === 'en_camino') {
    guiaHtml = `
      <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 4px;font-size:14px;font-weight:bold;color:#166534">
          \ud83d\udd0d N\u00famero de gu\u00eda:
        </p>
        <p style="margin:0 0 4px;font-family:monospace;font-size:18px;color:#166534">
          ${params.numeroGuia}
        </p>
        <p style="margin:0;font-size:12px;color:#6b7280">
          Us\u00e1 este n\u00famero para rastrear tu env\u00edo con la transportadora.
        </p>
      </div>
    `
  }

  const contenido = `
    <div style="text-align:center;font-size:48px;margin-bottom:16px">
      ${config.emoji}
    </div>
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;text-align:center">
      ${config.asunto}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;line-height:1.6">
      Hola ${params.nombre}, ${config.mensaje}
    </p>

    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center">
      Pedido: <strong>#${params.numeroPedido}</strong>
    </p>

    ${guiaHtml}

    <div style="text-align:center;margin:24px 0">
      <a href="${appUrl}/cuenta/pedidos" style="display:inline-block;background-color:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
        Ver mi pedido \u2192
      </a>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `${config.emoji} ${config.asunto} - ${params.numeroPedido}`,
      html: buildEmailBase({
        titulo: config.asunto,
        preheader: `${config.asunto} #${params.numeroPedido}`,
        contenido,
      }),
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    console.error('Error enviando email de actualizaci\u00f3n:', msg)
    return { ok: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// EMAIL 3: Bienvenida
// ---------------------------------------------------------------------------

export async function enviarEmailBienvenida(params: {
  email: string
  nombre: string
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? 'SiwuuShop'

  const contenido = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">
      \u00a1Bienvenido/a, ${params.nombre}! \ud83d\udc4b
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6">
      Tu cuenta en ${storeName} fue creada exitosamente.
    </p>

    <div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin:0 0 24px">
      <p style="margin:0 0 12px;font-size:14px;font-weight:bold;color:#374151">
        \u00bfQu\u00e9 pod\u00e9s hacer?
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;color:#6b7280;line-height:1.8">
        <tr><td>\u2705 Comprar productos con env\u00edo a toda Colombia</td></tr>
        <tr><td>\ud83d\udce6 Seguir el estado de tus pedidos en tiempo real</td></tr>
        <tr><td>\ud83d\udccd Guardar tus direcciones para comprar m\u00e1s r\u00e1pido</td></tr>
      </table>
    </div>

    <div style="text-align:center;margin:24px 0">
      <a href="${appUrl}/productos" style="display:inline-block;background-color:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
        Ver productos \u2192
      </a>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `\ud83d\udc4b Bienvenido/a a ${storeName}`,
      html: buildEmailBase({
        titulo: 'Bienvenido/a',
        preheader: `Tu cuenta en ${storeName} fue creada exitosamente.`,
        contenido,
      }),
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    console.error('Error enviando email de bienvenida:', msg)
    return { ok: false, error: msg }
  }
}
