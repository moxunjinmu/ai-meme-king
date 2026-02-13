import { cn } from "@/lib/utils"

interface AvatarProps {
  /** 用户头像 URL */
  src?: string | null
  /** 用户名，用于 alt 文本和首字母 fallback */
  alt: string
  /** 尺寸：sm (24px), md (32px), lg (80px) */
  size?: "sm" | "md" | "lg"
  /** 额外的 className */
  className?: string
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-xs",
  lg: "h-20 w-20 text-3xl",
}

/**
 * 可复用的用户头像组件
 * - 支持三种预设尺寸
 * - 无头像时显示首字母
 * - 自动保持图片比例不变形
 */
export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const baseClasses = cn(
    "rounded-full object-cover",
    sizeClasses[size],
    className
  )

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={baseClasses}
      />
    )
  }

  return (
    <div
      className={cn(
        baseClasses,
        "flex items-center justify-center font-bold text-white",
        size === "lg"
          ? "bg-gradient-to-br from-purple-500 to-pink-500"
          : "bg-purple-500"
      )}
    >
      {alt.charAt(0).toUpperCase()}
    </div>
  )
}
