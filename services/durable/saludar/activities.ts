export async function greet(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

export async function saludar(nombre: string): Promise<string> {
  if (Math.random() > 0.5) throw new Error('Random error');
  return `¡Hola, ${nombre}!`;
}
