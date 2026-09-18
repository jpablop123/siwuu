'use client'

import { MessageCircle } from 'lucide-react'
import { waLink } from '@/lib/brand'

/**
 * Botón flotante de WhatsApp.
 *
 * En Colombia es el canal donde la gente resuelve la desconfianza antes de
 * pagar. Va en verde de WhatsApp a propósito: es un código que la gente
 * reconoce de inmediato y no compite con el azul de las acciones de la tienda.
 *
 * En movil se apoya encima de la barra inferior: es un atajo, no un tab mas.
 * Mezclarlo con la navegacion le quitaria las dos cosas.
 */
export function WhatsAppFab({ numero }: { numero?: string | null }) {
  return (
    <a
      href={waLink(numero, 'Hola Siwuu 👋 quiero preguntar por un producto.')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lift transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:bottom-7 md:right-7"
      aria-label="Escribirnos por WhatsApp"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">Escríbenos</span>
    </a>
  )
}
