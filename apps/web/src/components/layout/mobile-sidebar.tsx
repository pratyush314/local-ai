'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarFooter } from './sidebar-footer';
import { ConversationSidebar } from '@/features/conversations/components/conversation-sidebar';

interface MobileSidebarProps {
	onNewChat?: () => void;
}

export function MobileSidebar({ onNewChat }: MobileSidebarProps) {
	const [open, setOpen] = useState(false);

	const handleNewChat = () => {
		setOpen(false);
		onNewChat?.();
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger
				render={
					<Button variant="ghost" size="icon" aria-label="Open sidebar" />
				}
			>
				<Menu />
			</SheetTrigger>

			<SheetContent side="left" className="w-72 p-0">
				<SheetHeader className="h-14 border-b px-4">
					<SheetTitle className="text-left">Local AI</SheetTitle>
				</SheetHeader>

				<div className="flex min-h-0 flex-1 flex-col">
					<div className="min-h-0 flex-1">
						<ConversationSidebar onNewChat={handleNewChat} />
					</div>

					<div className="border-t p-3">
						<SidebarFooter />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
