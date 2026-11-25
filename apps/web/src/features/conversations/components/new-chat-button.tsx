'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface NewChatButtonProps {
	onClick?: () => void;
	disabled?: boolean;
}

export function NewChatButton({
	onClick,
	disabled = false,
}: NewChatButtonProps) {
	return (
		<Button
			onClick={onClick}
			variant="outline"
			disabled={disabled}
			className="w-full justify-start gap-2"
		>
			<Plus className="size-4" />
			<span>New chat</span>
		</Button>
	);
}
