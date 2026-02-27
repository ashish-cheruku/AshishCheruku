import './globals.css';

export const metadata = {
    title: 'Ashish Kumar Cheruku | Portfolio',
    description: 'Interactive terminal-style portfolio for Ashish Kumar Cheruku — AI & DevOps Engineer.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="dark">
                {children}
            </body>
        </html>
    );
}
