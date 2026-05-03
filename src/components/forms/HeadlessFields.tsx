import {
  Input,
  Textarea,
  type InputProps,
  type TextareaProps,
} from '@headlessui/react'
import { forwardRef } from 'react'

export const HeadlessTextInput = forwardRef<HTMLInputElement, InputProps>(
  function HeadlessTextInput({ className, ...props }, ref) {
    return (
      <Input
        ref={ref}
        className={className}
        {...props}
      />
    )
  }
)

export const HeadlessTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function HeadlessTextarea({ className, ...props }, ref) {
    return (
      <Textarea
        ref={ref}
        className={className}
        {...props}
      />
    )
  }
)
