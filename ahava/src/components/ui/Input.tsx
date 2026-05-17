import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#8b92a8]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6178]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-[#161b27] border border-[#2a3347] rounded-lg px-3 py-2.5 text-sm text-[#e8eaf0]
              placeholder:text-[#5a6178] outline-none transition-all duration-150
              focus:border-[#c8a97e]/50 focus:ring-1 focus:ring-[#c8a97e]/20
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-9' : ''}
              ${error ? 'border-[#f87171]/50' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#f87171]">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
