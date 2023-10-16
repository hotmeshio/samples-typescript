export async function unpredictableFunction(name: string): Promise<string> {
  if (Math.random() < 0.5) {
    throw new Error('Random error');
  }
  return `Hello, ${name}!`;
}
