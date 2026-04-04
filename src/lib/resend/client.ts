import { Resend } from 'resend'
import { formatCOP } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Cliente Resend
// ---------------------------------------------------------------------------

const resendApiKey = process.env.RESEND_API_KEY ?? 'placeholder'

export const resend = new Resend(resendApiKey)

export const FROM_EMAIL = `${process.env.NEXT_PUBLIC_STORE_NAME ?? 'SiwuuShop'} <pedidos@${process.env.RESEND_FROM_DOMAIN ?? 'resend.dev'}>`

// ---------------------------------------------------------------------------
// Base HTML del email
// ---------------------------------------------------------------------------

export function buildEmailBase({
  titulo,
  preheader,
  contenido,
}: {
  titulo: string
  preheader: string
  contenido: string
}): string {
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? 'SiwuuShop'
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
  <!-- Preheader (invisible en el body, visible en el inbox preview) -->
  <span style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">
    ${preheader}
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6">
    <tr>
      <td align="center" style="padding:24px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <!-- Header -->
          <tr>
            <td style="background-color:#4f46e5;padding:32px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:-0.5px">
                ${storeName}
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px">
              ${contenido}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
                Este es un email automático, no respondas a este mensaje.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af">
                &copy; ${year} ${storeName}. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Fila de item del pedido
// ---------------------------------------------------------------------------

export function buildItemRow(item: {
  nombre: string
  variante?: string | null
  cantidad: number
  precioUnitario: number
}): string {
  const subtotal = item.cantidad * item.precioUnitario
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">
      ${item.nombre}${item.variante ? `<br><span style="font-size:12px;color:#9ca3af">${item.variante}</span>` : ''}
    </td>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:center">
      ${item.cantidad}
    </td>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:right">
      ${formatCOP(item.precioUnitario)}
    </td>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;text-align:right;font-weight:bold">
      ${formatCOP(subtotal)}
    </td>
  </tr>`
}

// ---------------------------------------------------------------------------
// Tabla de items completa
// ---------------------------------------------------------------------------

export function buildTablaItems(
  items: Array<{
    nombre: string
    variante?: string | null
    cantidad: number
    precioUnitario: number
  }>
): string {
  const rows = items.map(buildItemRow).join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0">
    <thead>
      <tr>
        <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;text-align:left;letter-spacing:0.5px">Producto</th>
        <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;text-align:center;letter-spacing:0.5px">Cant.</th>
        <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;text-align:right;letter-spacing:0.5px">Precio</th>
        <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;text-align:right;letter-spacing:0.5px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`
}
