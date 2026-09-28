'use client';

import { Square } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface StopGenerationButtonProps {
	onStop: () => void;
}

export function StopGenerationButton({ onStop }: StopGenerationButtonProps) {
	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			className="size-9 rounded-full"
			onClick={onStop}
			aria-label="Stop generation"
		>
			<Square className="size-3.5 fill-current" />
		</Button>
	);
}
