import { resolveMediaUrl } from "../api/client";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-16 w-16 text-xl",
};

export function Avatar({ name, imageUrl, size = "md" }: AvatarProps) {
  const sizeClasses = SIZE_CLASSES[size];
  const resolvedUrl = resolveMediaUrl(imageUrl);

  if (resolvedUrl) {
    return <img src={resolvedUrl} alt="" className={`${sizeClasses} shrink-0 rounded-full object-cover`} />;
  }

  return (
    <span
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full bg-gray-900/90 font-medium text-white`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
