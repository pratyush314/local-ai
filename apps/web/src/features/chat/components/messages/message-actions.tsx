'use client';

import { useState } from 'react';
import { Check, Copy, Pencil, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MessageActionsProps {
	content: string;
	onEdit?: () => void;
	onRegenerate?: () => void;
	disabled?: boolean;
}

export function MessageActions({
	content,
	onEdit,
	onRegenerate,
	disabled = false,
}: MessageActionsProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div className="mt-2 flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
				onClick={handleCopy}
				aria-label="Copy message"
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

			{onEdit && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
					onClick={onEdit}
					disabled={disabled}
					aria-label="Edit message"
				>
					<Pencil className="size-3.5" />
					Edit
				</Button>
			)}

			{onRegenerate && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
					onClick={onRegenerate}
					disabled={disabled}
					aria-label="Regenerate response"
				>
					<RefreshCw className="size-3.5" />
					Regenerate
				</Button>
			)}
		</div>
	);
}
