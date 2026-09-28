'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface NewChatButtonProps {
	onClick?: () => void;
}

export function NewChatButton({ onClick }: NewChatButtonProps) {
	return (
		<Button
			onClick={onClick}
			variant="outline"
			className="w-full justify-start gap-2"
		>
			<Plus className="size-4" />
			<span>New chat</span>
		</Button>
	);
}
