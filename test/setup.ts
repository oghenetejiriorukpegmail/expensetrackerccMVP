import { vi } from 'vitest';

// Mock the browser environment
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
const mockFileReader = {
  readAsDataURL: vi.fn(),
  onload: null,
  result: 'data:image/jpeg;base64,mockbase64data'
};

global.FileReader = vi.fn(() => mockFileReader) as any;

// Set up FileReader mocks to trigger callbacks
Object.defineProperty(mockFileReader, 'readAsDataURL', {
  value: function(blob: Blob) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this } as any);
      }
    });
  }
});

// Mock Blob
global.Blob = vi.fn((content, options) => ({
  size: 1024,
  type: options?.type || 'application/octet-stream'
})) as any;

// Mock form data
global.FormData = vi.fn(() => ({
  append: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  set: vi.fn(),
  forEach: vi.fn(),
  entries: vi.fn(),
  keys: vi.fn(),
  values: vi.fn()
})) as any;

// Set up environment variables
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_KEY = 'test-supabase-key';

// Mock console methods
global.console.warn = vi.fn();
global.console.error = vi.fn();
global.console.log = vi.fn();

// Mock Intl
global.Intl = {
  NumberFormat: vi.fn(() => ({
    format: (num: number) => `$${num.toFixed(2)}`
  })),
  DateTimeFormat: vi.fn(() => ({
    format: (date: Date) => date.toISOString().split('T')[0]
  }))
} as any;