import './globals.css';
import { Providers } from "./providers";
import { Launcher } from "@/components/Common";
import type { Metadata } from "next";

// interface Metadata extends RawMetadata {
//   'application-name': string;
// }

export const metadata: Metadata = {
  description: 'app desc',
  // manifest: '/manifest.json',
  title: 'app title'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang='en'>
  <body>
  <Providers>
    <Launcher />

    <main style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', width: '100%', color: 'white' }}>
      {children}
    </main>
  </Providers>
  </body>
  </html>
}
