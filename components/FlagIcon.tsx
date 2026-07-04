import * as Flags from "country-flag-icons/react/3x2";

type FlagComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export default function FlagIcon({ country, className = "" }: { country: string; className?: string }) {
  const Flag = (Flags as unknown as Record<string, FlagComponent>)[country];
  if (!Flag) return null;
  return (
    <span className={`inline-block h-[18px] w-6 flex-none overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10 ${className}`}>
      <Flag className="h-full w-full object-cover" />
    </span>
  );
}
