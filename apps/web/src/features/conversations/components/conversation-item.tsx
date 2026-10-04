'use client';

import { useState } from 'react';
import { MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { Conversation } from '../types/conversation.types';

interface ConversationItemProps {
	conversation: Conversation;
	active?: boolean;
	onClick?: () => void;
	onDelete?: () => void | Promise<void>;
}

export function ConversationItem({
	conversation,
	active = false,
	onClick,
	onDelete,
}: ConversationItemProps) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!onDelete || isDeleting) {
			return;
		}

		try {
			setIsDeleting(true);

			await onDelete();

			setIsDeleteDialogOpen(false);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<>
			<div
				className={cn(
					'group flex w-full items-center gap-1 rounded-lg px-1 text-sm transition-colors',
					'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
					active && 'bg-sidebar-accent text-sidebar-accent-foreground',
				)}
			>
				<button
					type="button"
					onClick={onClick}
					className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-2 text-left"
				>
					<MessageSquare className="size-4 shrink-0 text-muted-foreground" />

					<span className="min-w-0 flex-1 truncate">{conversation.title}</span>
				</button>

				{onDelete && (
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className={cn(
										'size-7 shrink-0 text-muted-foreground',
										'opacity-0 transition-opacity',
										'group-hover:opacity-100',
										'focus-visible:opacity-100',
									)}
									aria-label={`Actions for ${conversation.title}`}
								>
									<MoreHorizontal className="size-4" />
								</Button>
							}
						/>

						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem
								variant="destructive"
								onClick={() => setIsDeleteDialogOpen(true)}
							>
								<Trash2 className="size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={(open) => {
					if (!isDeleting) {
						setIsDeleteDialogOpen(open);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete conversation?</AlertDialogTitle>

						<AlertDialogDescription>
							This will permanently delete{' '}
							<span className="font-medium text-foreground">
								&quot;{conversation.title}&quot;
							</span>{' '}
							and all of its messages. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

						<AlertDialogAction
							variant="destructive"
							disabled={isDeleting}
							onClick={(event) => {
								event.preventDefault();
								void handleDelete();
							}}
						>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
