'use client';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function WhatsAppButton() {
  const pathname = usePathname()

  // Optional: hide on admin pages so it doesn't cover up the admin layout
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link 
        href="https://wa.me/message/GU7WQCCY7NH2N1" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#25D366]/50"
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle size={28} className="transition-transform group-hover:-rotate-12" />
        
        {/* Tooltip */}
        <span className="pointer-events-none absolute -top-12 right-0 w-max translate-x-2 opacity-0 rounded-xl bg-black px-4 py-2 text-xs font-bold text-white shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:opacity-100 dark:bg-white dark:text-black">
          Chat with us
        </span>
      </Link>
    </div>
  )
}
