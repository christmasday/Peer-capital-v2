import Link from "next/link"
import Image from "next/image"

interface LogoProps {
  className?: string
  width?: number
  height?: number
  href?: string
}

export function Logo({ className = "", width = 200, height = 50, href = "/home" }: LogoProps) {
  const logoContent = (
    <div className={`relative flex items-center ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
      <Image
        src="/peer-capital-logo-new.png"
        alt="Peer Capital"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
