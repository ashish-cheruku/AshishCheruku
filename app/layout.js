import './globals.css';

export const metadata = {
    title: 'Ashish Kumar Cheruku | Portfolio',
    description: 'Interactive terminal-style portfolio for Ashish Kumar Cheruku — AI & DevOps Engineer.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap" rel="stylesheet" />
            </head>
            <body className="dark">
                {children}
            </body>
        </html>
    );
}
