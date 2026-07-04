import Image from "next/image";

const dims = {
  sm: { h: 40, w: 69 },
  md: { h: 52, w: 89 },
  lg: { h: 72, w: 124 },
};

export default function Logo({ size = "md", dark = false }: { size?: "sm" | "md" | "lg"; dark?: boolean }) {
  const { h, w } = dims[size];
  const img = (
    <Image src="/logo.png" alt="HME — Hasani Munawarah Exchange" width={w} height={h} priority className="h-full w-auto" />
  );
  if (!dark) return <span style={{ height: h }} className="inline-flex items-center">{img}</span>;
  return (
    <span style={{ height: h + 16 }} className="inline-flex items-center rounded-lg bg-white px-3 py-2">
      {img}
    </span>
  );
}
