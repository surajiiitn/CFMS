import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const RatingStars = ({
  rating,
  max = 5,
  size = 16,
  interactive = false,
  onChange,
}: {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
}) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "transition-colors",
          i < Math.floor(rating) ? "fill-warning text-warning" : "text-muted-foreground/30",
          interactive && "cursor-pointer hover:text-warning"
        )}
        size={size}
        onClick={() => interactive && onChange?.(i + 1)}
      />
    ))}
  </div>
);
