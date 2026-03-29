import type { ChatMode } from '../model/types'

const personaReplies: Record<ChatMode['id'], string> = {
  command:
    'Sentinel posture locked. I would convert this into an execution stack, kill ambiguity, and surface the single move that changes the board fastest.',
  strategy:
    'Acquisition Operator posture: widen the frame, tighten the sequence, and do not confuse motion for leverage. The board only cares about decisive outcomes.',
  build:
    'Software Engineer posture: keep the architecture seam clean, isolate the mock transport, and make runtime integration a swap rather than a rewrite.',
}

export async function simulateLocalReply(input: string, mode: ChatMode): Promise<string> {
  await new Promise((resolve) => window.setTimeout(resolve, 320))

  const trimmed = input.trim()
  const persona = personaReplies[mode.id]

  return `${persona}\\n\\nLocal read: “${trimmed}” is now captured in the chat state and could be forwarded to a real runtime adapter later.`
}
