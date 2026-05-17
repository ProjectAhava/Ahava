interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className={`${sizeMap[size]} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name ?? ''} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-[#c8a97e]/20 border border-[#c8a97e]/30 flex items-center justify-center text-[#c8a97e] font-semibold font-sans">
          {initials}
        </div>
      )}
    </div>
  )
}
