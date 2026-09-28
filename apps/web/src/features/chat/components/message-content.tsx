'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageContentProps {
	content: string;
	isStreaming?: boolean;
}

export function MessageContent({
	content,
	isStreaming = false,
}: MessageContentProps) {
	return (
		<div
			className={cn(
				'min-w-0 text-sm leading-7',
				'[&_p]:mb-4 [&_p:last-child]:mb-0',
				'[&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc',
				'[&_ol]:mb-4 [&_ol]:ml-6 [&_ol]:list-decimal',
				'[&_li]:pl-1',
				'[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
				'[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
				'[&_hr]:my-6 [&_hr]:border-border',
				'[&_table]:w-full [&_table]:border-collapse',
				'[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left',
				'[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2',
			)}
		>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					code: CodeBlock,
				}}
			>
				{content}
			</ReactMarkdown>

			{isStreaming && (
				<span
					aria-label="Generating"
					className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-current align-middle"
				/>
			)}
		</div>
	);
}

interface CodeBlockProps {
	children?: React.ReactNode;
	className?: string;
	inline?: boolean;
}

function CodeBlock({ children, className, inline }: CodeBlockProps) {
	const code = String(children).replace(/\n$/, '');

	if (inline || !className) {
		return (
			<code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
				{children}
			</code>
		);
	}

	const language = className.replace('language-', '').trim();

	return <CodeBlockContainer code={code} language={language} />;
}

interface CodeBlockContainerProps {
	code: string;
	language?: string;
}

function CodeBlockContainer({ code, language }: CodeBlockContainerProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);

		setCopied(true);

		window.setTimeout(() => {
			setCopied(false);
		}, 1500);
	};

	return (
		<div className="my-4 overflow-hidden rounded-xl border bg-muted/40">
			<div className="flex h-9 items-center justify-between border-b bg-muted/60 px-3">
				<span className="font-mono text-xs text-muted-foreground">
					{language || 'code'}
				</span>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 gap-1.5 px-2 text-xs"
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

			<pre className="overflow-x-auto p-4">
				<code className="font-mono text-[13px] leading-6">{code}</code>
			</pre>
		</div>
	);
}
