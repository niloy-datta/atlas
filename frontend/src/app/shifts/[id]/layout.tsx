export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function ShiftDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
