import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className, 
    src, 
    alt, 
    fallback, 
    size = 'md',
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12'
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-xl",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-semibold text-sm">
            {fallback || 'JD'}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }

