export type Role = 'system' | 'user';
export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

/** Tools that change state or move money. The model may PROPOSE them; only a human approves. */
export const HIGH_RISK_TOOLS = new Set(['execute_wire_transfer']);
