'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';
import { CodeBlock } from '../markdown/code/code-block';

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
				'min-w-0 text-[15px] leading-7 md:text-base',

				'[&_p]:mb-5',
				'[&_p:last-child]:mb-0',

				'[&_ul]:mb-5',
				'[&_ul]:ml-6',
				'[&_ul]:list-disc',

				'[&_ol]:mb-5',
				'[&_ol]:ml-6',
				'[&_ol]:list-decimal',

				'[&_li]:pl-1',

				'[&_blockquote]:my-4',
				'[&_blockquote]:border-l-2',
				'[&_blockquote]:pl-4',
				'[&_blockquote]:text-muted-foreground',

				'[&_a]:font-medium',
				'[&_a]:text-primary',
				'[&_a]:underline',
				'[&_a]:underline-offset-4',

				'[&_hr]:my-6',
				'[&_hr]:border-border',

				'[&_table]:w-full',
				'[&_table]:border-collapse',

				'[&_th]:border',
				'[&_th]:border-border',
				'[&_th]:bg-muted',
				'[&_th]:px-3',
				'[&_th]:py-2',
				'[&_th]:text-left',

				'[&_td]:border',
				'[&_td]:border-border',
				'[&_td]:px-3',
				'[&_td]:py-2',
			)}
		>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					code: MarkdownCode,
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

interface MarkdownCodeProps {
	children?: React.ReactNode;
	className?: string;
}

function MarkdownCode({ children, className }: MarkdownCodeProps) {
	const code = String(children).replace(/\n$/, '');

	const language = className?.replace('language-', '').trim();

	if (!language) {
		return (
			<code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[1em]">
				{children}
			</code>
		);
	}

	return <CodeBlock code={code} language={language} />;
}
