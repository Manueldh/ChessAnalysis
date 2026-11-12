import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Chess Review · Every move is a lesson',description:'Review your games with Stockfish, explore better moves, and build better chess habits.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
