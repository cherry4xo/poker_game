import './globals.css';
import { Providers } from './providers';
import { Header, Launcher } from '@/components/Common';
import type { Metadata } from 'next';
import { Box } from '@chakra-ui/react';

// interface Metadata extends RawMetadata {
//   'application-name': string;
// }

export const metadata: Metadata = {
    description: 'online game',
    // manifest: '/manifest.json',
    title: 'online game'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <html lang='en'>
    <body>
    <Providers>
        <Launcher />

        <main style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100svh', width: '100%', color: 'white' }}>
            <Box w='100%' pos='fixed' top={0} left={0} p='20px'><Header /></Box>
            {children}
        </main>
    </Providers>
    </body>
    </html>;
}
