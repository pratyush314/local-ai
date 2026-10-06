import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';

import '@/app/globals.css';

import { ThemeProvider } from '@/providers/theme-provider';

const anthropicSans = Inter({
	variable: '--font-anthropic-sans',
	subsets: ['latin'],
	display: 'swap',
});

const anthropicSerif = Source_Serif_4({
	variable: '--font-anthropic-serif',
	subsets: ['latin'],
	display: 'swap',
	weight: ['400', '500', '600'],
});

const jetBrainsMono = JetBrains_Mono({
	variable: '--font-code',
	subsets: ['latin'],
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'Local AI',
	description: 'A private, local-first AI assistant.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${anthropicSans.variable} ${anthropicSerif.variable} ${jetBrainsMono.variable} antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem={false}
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
