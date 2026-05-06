import "./globals.css";
export const metadata = { title: "Mountain Window", description: "Weather window alerts for alpine and ski objectives" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
