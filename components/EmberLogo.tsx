import Image from "next/image"
import emLogo from "./Adobe Express - file (1).png"

export function EmberLogo({
  size = 40,
  className = "",
}: {
  size?: number
  className?: string
}) {
  return (
    <Image
      src={emLogo}
      alt="Ember Logo"
      width={size}
      height={size}
      className={className}
    />
  )
}