// components/ui/label.tsx
import React from 'react'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ children, style, ...props }: LabelProps) {
  return (
    <label className="label-dls" style={style} {...props}>
      {children}
    </label>
  )
}

export default Label