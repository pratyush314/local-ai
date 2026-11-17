import 'server-only';

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class FolderPickerService {
	async selectFolder(): Promise<string | null> {
		if (process.platform !== 'win32') {
			throw new Error('Folder picker is currently supported on Windows only.');
		}

		const script = [
			'Add-Type -AssemblyName System.Windows.Forms',
			'$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
			'$dialog.Description = "Select a project root directory"',
			'$dialog.ShowNewFolderButton = $false',
			'try {',
			'  $result = $dialog.ShowDialog()',
			'  if ($result -eq [System.Windows.Forms.DialogResult]::OK) {',
			'    [Console]::Out.Write($dialog.SelectedPath)',
			'    exit 0',
			'  }',
			'  exit 2',
			'} finally {',
			'  $dialog.Dispose()',
			'}',
		].join('\n');

		try {
			const { stdout } = await execFileAsync(
				'powershell.exe',
				[
					'-NoProfile',
					'-STA',
					'-ExecutionPolicy',
					'Bypass',
					'-Command',
					script,
				],
				{
					windowsHide: true,
					timeout: 120_000,
					maxBuffer: 1024 * 1024,
				},
			);

			const selectedPath = stdout.trim();

			return selectedPath.length > 0 ? selectedPath : null;
		} catch (error) {
			const exitCode =
				typeof error === 'object' && error !== null && 'code' in error
					? error.code
					: undefined;

			if (exitCode === 2) {
				return null;
			}

			throw new Error('Unable to open the Windows folder picker.', {
				cause: error,
			});
		}
	}
}
