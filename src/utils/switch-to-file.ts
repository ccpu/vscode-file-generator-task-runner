import { Uri, window } from 'vscode';

export async function switchToFile(
  file: string,
): Promise<void | import('vscode').TextEditor> {
  try {
    return await window.showTextDocument(Uri.file(file));
  } catch (error) {
    // Handle the error here (log, notify, etc.)
    console.error('Failed to switch to file:', error);
    throw error;
  }
}
