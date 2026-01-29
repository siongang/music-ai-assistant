/**
 * Studio Route Group Layout
 * 
 * Base layout wrapper for all studio routes.
 * Nested layouts handle specific UI for home vs project pages.
 */

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
