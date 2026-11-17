import { NextResponse } from 'next/server';

import { FolderPickerService } from '@/lib/server/folder-picker.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const folderPicker = new FolderPickerService();

export async function POST() {
	try {
		const path = await folderPicker.selectFolder();

		return NextResponse.json({ path });
	} catch (error) {
		console.error('Folder selection failed:', error);

		return NextResponse.json(
			{ message: 'Unable to open the folder picker.' },
			{ status: 500 },
		);
	}
}
