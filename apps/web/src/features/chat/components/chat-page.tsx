'use client';

import { ArrowUp } from 'lucide-react';

import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function ChatPage() {
	return (
		<div className="flex h-full min-h-0 flex-col">
			{/* Header */}
			<header className="flex h-14 shrink-0 items-center border-b px-3 md:px-4">
				<div className="flex min-w-0 items-center gap-2">
					<div className="md:hidden">
						<MobileSidebar />
					</div>

					<div className="min-w-0">
						<h1 className="truncate text-sm font-medium">New conversation</h1>
					</div>
				</div>
			</header>

			{/* Conversation */}
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="flex flex-1 items-center justify-center px-4">
					<div className="w-full max-w-2xl text-center">
						<h2 className="text-2xl font-semibold tracking-tight">
							Start a conversation
						</h2>

						<p className="mt-2 text-sm text-muted-foreground">
							Ask anything. Your conversation stays on your local machine.
						</p>
					</div>
				</div>

				{/* Input */}
				<div className="mx-auto w-full max-w-3xl px-4 pb-4">
					<div className="rounded-2xl border bg-background shadow-sm">
						<div className="p-3">
							<Textarea
								placeholder="Message Local AI..."
								rows={1}
								className="min-h-12 w-full resize-none border-0 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
							/>
						</div>

						<div className="flex items-center justify-end px-3 pb-3">
							<Button
								size="icon"
								className="size-8 rounded-full"
								aria-label="Send message"
							>
								<ArrowUp />
							</Button>
						</div>
					</div>

					<p className="mt-2 text-center text-xs text-muted-foreground">
						Local AI can make mistakes. Check important information.
					</p>
				</div>
			</div>
		</div>
	);
}
