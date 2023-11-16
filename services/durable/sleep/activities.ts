export async function hi(name: string): Promise<string> {
  return `Sleep Hi, ${name}!`;
}

export async function bye(name: string): Promise<string> {
  return `Sleep Bye, ${name}!`;
}
