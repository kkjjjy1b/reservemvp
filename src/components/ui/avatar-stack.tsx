import { Avatar, type AvatarIdentity } from "@/components/ui/avatar";

type AvatarStackItem = AvatarIdentity & {
  id: string;
  description?: string;
};

type AvatarStackProps = {
  items: AvatarStackItem[];
  maxVisible?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showNames?: boolean;
  className?: string;
  emptyLabel?: string;
  overflowLabel?: (hiddenCount: number) => string;
};

const SIZE_TO_STACK_CLASS: Record<NonNullable<AvatarStackProps["size"]>, string> = {
  xs: "-space-x-1.5",
  sm: "-space-x-2",
  md: "-space-x-2.5",
  lg: "-space-x-3",
};

const SIZE_TO_TEXT_CLASS: Record<NonNullable<AvatarStackProps["size"]>, string> = {
  xs: "text-[11px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};

export type { AvatarStackItem };

export function AvatarStack({
  items,
  maxVisible = 4,
  size = "sm",
  showNames = false,
  className = "",
  emptyLabel = "참여자 없음",
  overflowLabel = (hiddenCount) => `+${hiddenCount}`,
}: AvatarStackProps) {
  const visibleItems = items.slice(0, maxVisible);
  const hiddenCount = Math.max(items.length - visibleItems.length, 0);

  if (items.length === 0) {
    return <span className={`text-[#9b9a97] ${SIZE_TO_TEXT_CLASS[size]}`}>{emptyLabel}</span>;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex ${SIZE_TO_STACK_CLASS[size]} items-center`}>
        {visibleItems.map((item, index) => (
          <Avatar
            key={item.id}
            name={item.name}
            avatarUrl={item.avatarUrl}
            avatarSeed={item.avatarSeed ?? item.id}
            size={size}
            title={item.description ?? item.name}
            className={`border-white ${index === 0 ? "ring-2 ring-white" : ""}`}
          />
        ))}

        {hiddenCount > 0 && (
          <div
            className={`inline-flex items-center justify-center rounded-full border border-black/5 bg-[#f3f1ee] font-semibold text-[#6b6a67] ${SIZE_TO_TEXT_CLASS[size]} ${getSizeClassName(size)}`}
            title={`${hiddenCount}명 더 보기`}
            aria-label={`${hiddenCount}명 더 보기`}
          >
            {overflowLabel(hiddenCount)}
          </div>
        )}
      </div>

      {showNames && (
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {visibleItems.map((item) => (
              <span key={item.id} className={`font-medium text-[#37352f] ${SIZE_TO_TEXT_CLASS[size]}`}>
                {item.name}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className={`text-[#9b9a97] ${SIZE_TO_TEXT_CLASS[size]}`}>
                {overflowLabel(hiddenCount)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getSizeClassName(size: NonNullable<AvatarStackProps["size"]>) {
  switch (size) {
    case "xs":
      return "h-5 w-5";
    case "sm":
      return "h-7 w-7";
    case "md":
      return "h-8 w-8";
    case "lg":
      return "h-10 w-10";
  }
}
