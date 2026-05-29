import * as React from "react"
import * as DialogPrimitive from "@headlessui/react"
import * as DialogRadix from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Dialog
const DialogPortal = DialogPrimitive.Transition.Root
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Transition.Child
    as={DialogPrimitive.Fragment}
    enter="ease-out duration-300"
    enterFrom="opacity-0"
    enterTo="opacity-100"
    leave="ease-in duration-200"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
  >
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  </DialogPrimitive.Transition.Child>
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogRadix.Content>,
  React.ComponentPropsWithoutRef<typeof DialogRadix.Content>
>(({ className, children, title, ...props }, ref) => (
  <DialogPortal>
    <DialogPrimitive.Transition.Child
      as={DialogPrimitive.Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      enterTo="opacity-100 translate-y-0 sm:scale-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0 sm:scale-100"
      leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    >
      <DialogRadix.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-white p-6 shadow-2xl shadow-slate-500/20 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl md:w-full max-h-[90vh] overflow-y-auto",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <DialogPrimitive.Title className="text-lg font-semibold text-white">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="text-white hover:text-slate-200">
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogRadix.Content>
    </DialogPrimitive.Transition.Child>
  </DialogPortal>
))
DialogContent.displayName = DialogRadix.Content.displayName

export { Dialog, DialogPortal, DialogOverlay, DialogContent }

