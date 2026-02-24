// Helper function to parse options string (handles both JSON array and newline-separated)
export function parseOptionsToLines(options: string): string {
  if (!options) return '';

  // Try to parse as JSON array
  try {
    const parsed = JSON.parse(options);
    if (Array.isArray(parsed)) {
      return parsed.join('\n');
    }
  } catch {
    // Not JSON, return as-is (already newline-separated)
  }
  return options;
}

// Helper function to convert lines back to JSON array format for backend storage
export function linesToOptionsString(lines: string): string {
  if (!lines || !lines.trim()) return '[]';

  // Split by newlines and filter empty lines
  const options = lines
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Return as JSON array string
  return JSON.stringify(options);
}
