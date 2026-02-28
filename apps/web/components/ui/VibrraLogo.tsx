import Image from "next/image";

interface VibrraLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function VibrraLogo({ width = 160, height, className }: VibrraLogoProps) {
  const h = height ?? Math.round((width / 660) * 120);
  return (
    <Image
      src="/vibrra-logo.svg"
      alt="VIBRRA"
      width={width}
      height={h}
      className={className}
      priority
    />
  );
}
