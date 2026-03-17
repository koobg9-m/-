"use client";

type Props = {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClass = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" };

export default function StarRating({ value, onChange, readonly = false, size = "md" }: Props) {
  const stars = [1, 2, 3, 4, 5];
  const cls = sizeClass[size];
  return (
    <div className="flex gap-0.5">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          className={`${cls} ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
          aria-label={`${s}점`}
        >
          <span className={value >= s ? "text-amber-400" : "text-gray-200"}>★</span>
        </button>
      ))}
    </div>
  );
}
