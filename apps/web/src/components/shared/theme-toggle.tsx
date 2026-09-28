'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	const isDark = theme === 'dark';

	return (
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setTheme(isDark ? 'light' : 'dark')}
					aria-label="Toggle theme"
				>
					{isDark ? <Sun /> : <Moon />}
				</Button>
			</TooltipTrigger>

			<TooltipContent>{isDark ? 'Light mode' : 'Dark mode'}</TooltipContent>
		</Tooltip>
	);
}
