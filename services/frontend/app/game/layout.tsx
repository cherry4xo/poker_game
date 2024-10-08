export default function GameLayout({ children }: { children: React.ReactNode }) {
    return <main style={{ width: '100%', height: '100svh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundImage: 'url(/bg.png)', backgroundSize: 'cover' }}>
        {children}
    </main>
}