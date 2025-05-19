"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface ActionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  isDisabled?: boolean;
}

export function ActionLink({ href, children, className, isDisabled = false }: ActionLinkProps) {
  // Si está deshabilitado, prevenir la navegación
  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
    }
  };

  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
} 