'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

interface CodeHighlightProps {
	code: string;
	language: string;
}

export function CodeHighlight({ code, language }: CodeHighlightProps) {
	const [html, setHtml] = useState<string | null>(null);
	const { theme } = useTheme();

	useEffect(() => {
		let cancelled = false;

		const highlight = async () => {
			try {
				const result = await codeToHtml(code, {
					lang: normalizeLanguage(language),
					theme: theme === 'dark' ? 'github-dark' : 'github-light',
				});

				if (!cancelled) {
					setHtml(result);
				}
			} catch {
				if (!cancelled) {
					setHtml(null);
				}
			}
		};

		void highlight();

		return () => {
			cancelled = true;
		};
	}, [code, language, theme]);

	if (!html) {
		return (
			<pre className="overflow-x-auto p-4">
				<code className="font-mono text-[13px] leading-6">{code}</code>
			</pre>
		);
	}

	return (
		<div
			className="overflow-x-auto p-4 text-[13px] leading-6"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

function normalizeLanguage(language: string): string {
	const aliases: Record<string, string> = {
		js: 'javascript',
		ts: 'typescript',
		jsx: 'jsx',
		tsx: 'tsx',
		sh: 'shellscript',
		bash: 'shellscript',
		zsh: 'shellscript',
		yml: 'yaml',
		md: 'markdown',
		text: 'text',
		txt: 'text',
	};

	return aliases[language.toLowerCase()] ?? language.toLowerCase();
}
