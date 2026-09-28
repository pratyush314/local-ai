'use client';

import { useEffect, useState } from 'react';
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
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);
	}, []);

	const isDark = theme === 'dark';

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						onClick={() => setTheme(isDark ? 'light' : 'dark')}
						variant="ghost"
						size="icon"
						aria-label="Toggle theme"
					/>
				}
			>
				{mounted ? isDark ? <Sun /> : <Moon /> : <span className="size-4" />}
			</TooltipTrigger>

			<TooltipContent>
				{mounted ? (isDark ? 'Light mode' : 'Dark mode') : 'Toggle theme'}
			</TooltipContent>
		</Tooltip>
	);
}
