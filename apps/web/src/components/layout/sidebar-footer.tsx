'use client';

import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export function SidebarFooter() {
	return (
		<div className="flex items-center justify-between">
			<Button
				variant="ghost"
				className="justify-start gap-2 text-muted-foreground hover:text-foreground"
			>
				<Settings className="size-4" />
				<span>Settings</span>
			</Button>

			<ThemeToggle />
		</div>
	);
}
