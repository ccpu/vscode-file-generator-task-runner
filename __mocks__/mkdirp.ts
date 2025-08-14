import { vi } from 'vitest';

// Mock function for mkdirp.sync
const sync = vi.fn().mockImplementation(() => undefined);

// Mock function for mkdirp itself (main function)
const mkdirp = vi.fn().mockImplementation(() => undefined) as any;

// Attach sync as a property to the main function
mkdirp.sync = sync;

export default mkdirp;
