'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <motion.li
            key={item.href}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            {index > 0 && <span className="text-slate-600">/</span>}
            {index === items.length - 1 ? (
              <span className="text-cyan-400 font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            )}
          </motion.li>
        ))}
      </ol>
    </nav>
  );
}
