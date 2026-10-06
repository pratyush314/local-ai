'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { CodeHighlight } from './code-highlight';

interface CodeBlockProps {
	code: string;
	language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);

			setCopied(true);

			window.setTimeout(() => {
				setCopied(false);
			}, 1500);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div
			className="my-4 overflow-hidden rounded-xl border"
			style={{
				backgroundColor: 'var(--code-background)',
				color: 'var(--code-foreground)',
			}}
		>
			<div className="flex h-9 items-center justify-between border-b border-border/50 px-3">
				<span className="font-mono text-xs text-white/60">
					{language || 'code'}
				</span>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 gap-1.5 px-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
					onClick={handleCopy}
				>
					{copied ? (
						<>
							<Check className="size-3.5" />
							Copied
						</>
					) : (
						<>
							<Copy className="size-3.5" />
							Copy
						</>
					)}
				</Button>
			</div>

			<CodeHighlight code={code} language={language || 'text'} />
		</div>
	);
}
