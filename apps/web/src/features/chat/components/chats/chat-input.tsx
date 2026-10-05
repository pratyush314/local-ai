'use client';

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StopGenerationButton } from '../buttons/stop-generation-button';

interface ChatInputProps {
	onSend?: (content: string) => void;
	onStop?: () => void;
	isGenerating?: boolean;
	disabled?: boolean;
}

export function ChatInput({
	onSend,
	onStop,
	isGenerating = false,
	disabled = false,
}: ChatInputProps) {
	const [value, setValue] = useState('');

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const canSend = value.trim().length > 0 && !disabled && !isGenerating;

	const submit = () => {
		const content = value.trim();

		if (!content || !canSend) {
			return;
		}

		onSend?.(content);

		setValue('');

		requestAnimationFrame(() => {
			textareaRef.current?.focus();
		});
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	};

	const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const textarea = event.target;

		setValue(textarea.value);

		textarea.style.height = 'auto';
		textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
	};

	return (
		<div className="mx-auto w-full max-w-3xl px-4 pb-4">
			<div
				className={cn(
					'rounded-2xl border bg-background shadow-sm',
					'transition-shadow',
				)}
			>
				<div className="px-3 pt-3">
					<Textarea
						ref={textareaRef}
						value={value}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						disabled={disabled || isGenerating}
						rows={1}
						placeholder="Message Local AI..."
						className={cn(
							'min-h-12 max-h-50 w-full resize-none',
							'border-0 bg-transparent px-1 py-2',
							'text-sm leading-6',
							'outline-none ring-0',
							'focus:border-0 focus:outline-none focus:ring-0',
							'focus-visible:border-0 focus-visible:outline-none',
							'focus-visible:ring-0',
							'placeholder:text-muted-foreground',
							'disabled:cursor-not-allowed disabled:opacity-60',
						)}
					/>
				</div>

				<div className="flex items-center justify-end px-3 pb-3">
					{isGenerating ? (
						<StopGenerationButton onStop={() => onStop?.()} />
					) : (
						<Button
							type="button"
							size="icon"
							className="size-9 rounded-full"
							disabled={!canSend}
							onClick={submit}
							aria-label="Send message"
						>
							<ArrowUp />
						</Button>
					)}
				</div>
			</div>

			<p className="mt-2 text-center text-xs text-muted-foreground">
				Local AI can make mistakes. Check important information.
			</p>
		</div>
	);
}
