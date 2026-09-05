export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function JobDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
