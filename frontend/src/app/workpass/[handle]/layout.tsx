export function generateStaticParams() {
  return [{ handle: "demo" }];
}

export default function WorkPassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
