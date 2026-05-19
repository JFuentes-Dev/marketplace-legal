// components/ui/input.tsx
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ style, className, ...props }: InputProps) {
  return (
    <input
      className="input-dls"
      style={style}
      {...props}
    />
  )
}

export default Input