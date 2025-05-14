import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

type BreadcrumbItem = {
  title: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  homeHref?: string
  includeHome?: boolean
}

export function Breadcrumb({
  items,
  homeHref = "/",
  includeHome = true,
}: BreadcrumbProps) {
  const allItems = includeHome
    ? [{ title: "Inicio", href: homeHref }, ...items]
    : items

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1
        const isFirst = index === 0
        
        return (
          <div key={`${item.title}-${index}`} className="flex items-center">
            {isFirst && includeHome && (
              <Home className="mr-1 h-4 w-4 text-muted-foreground" />
            )}
            
            {item.href && !isLast ? (
              <Link 
                href={item.href} 
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                {item.title}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-foreground" : ""}>
                {item.title}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )
      })}
    </nav>
  )
} 