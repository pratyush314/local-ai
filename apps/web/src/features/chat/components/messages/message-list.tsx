'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { MessageItem } from './message-item';
import { ChatMessage } from '../../types/chat.types';

interface MessageListProps {
	messages: ChatMessage[];
}

const BOTTOM_THRESHOLD = 80;

export function MessageList({ messages }: MessageListProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	/**
	 * Whether streaming should keep the viewport pinned to the bottom.
	 *
	 * This is intentionally a ref rather than state.
	 * Streaming can update messages many times per second, so this
	 * should not participate in the React render cycle.
	 */
	const shouldFollowRef = useRef(true);

	const [showJumpToLatest, setShowJumpToLatest] = useState(false);

	const isAtBottom = useCallback(() => {
		const container = scrollContainerRef.current;

		if (!container) {
			return true;
		}

		const distanceFromBottom =
			container.scrollHeight - container.scrollTop - container.clientHeight;

		return distanceFromBottom <= BOTTOM_THRESHOLD;
	}, []);

	const handleScroll = useCallback(() => {
		const atBottom = isAtBottom();

		shouldFollowRef.current = atBottom;

		setShowJumpToLatest((current) => {
			const next = !atBottom;

			return current === next ? current : next;
		});
	}, [isAtBottom]);

	const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
		bottomRef.current?.scrollIntoView({
			behavior,
			block: 'end',
		});

		shouldFollowRef.current = true;
		setShowJumpToLatest(false);
	}, []);

	/**
	 * Listen for user scrolling.
	 */
	useEffect(() => {
		const container = scrollContainerRef.current;

		if (!container) {
			return;
		}

		container.addEventListener('scroll', handleScroll, {
			passive: true,
		});

		return () => {
			container.removeEventListener('scroll', handleScroll);
		};
	}, []);

	/**
	 * Follow new content only when the user has not scrolled away
	 * from the bottom.
	 *
	 * `shouldFollowRef` is deliberately used instead of state so
	 * streaming tokens don't create a render/effect feedback loop.
	 */
	useEffect(() => {
		if (!shouldFollowRef.current) {
			return;
		}

		bottomRef.current?.scrollIntoView({
			behavior: 'auto',
			block: 'end',
		});
	}, [messages]);

	if (messages.length === 0) {
		return null;
	}

	return (
		<div
			ref={scrollContainerRef}
			className="relative min-h-0 flex-1 overflow-y-auto"
		>
			<div className="pb-8 pt-4">
				{messages.map((message) => (
					<MessageItem key={message.id} message={message} />
				))}

				<div ref={bottomRef} />
			</div>

			{showJumpToLatest && (
				<div className="sticky bottom-4 z-10 flex justify-center">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						className="gap-1.5 rounded-full border bg-background/95 shadow-md backdrop-blur"
						onClick={() => scrollToBottom('smooth')}
					>
						<ArrowDown className="size-3.5" />
						Jump to latest
					</Button>
				</div>
			)}
		</div>
	);
}
