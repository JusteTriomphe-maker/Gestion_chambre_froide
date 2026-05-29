import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-card text-card-foreground shadow-lg shadow-slate-200/50 border-slate-100 overflow-hidden',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-semibold leading-none tracking-tight text-slate-900',
        className
      )}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-slate-500', className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props} />
  )
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
}

function StatCard({
  color = 'red', // red, blue, green
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { color?: 'red' | 'blue' | 'green' }) {
  const colors = {
    red: 'border-red-600',
    blue: 'border-blue-600',
    green: 'border-green-600'
  }

  return (
    <Card className={cn('overflow-hidden shadow-lg rounded-lg p-6 border-l-4', colors[color], className)} {...props} />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardContent, CardDescription, StatCard }

