import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Logo({ 
  className, 
  width = 200, 
  height = 200 
}: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Package Forwarding Platform"
      width={width}
      height={height}
      className={cn("object-contain", className)}
    />
  );
}