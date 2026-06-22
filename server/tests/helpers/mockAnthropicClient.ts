import { vi } from "vitest";

const fakeQuizPayload = {
  questions: [
    {
      question: "Test Q?",
      options: ["A", "B", "C", "D"],
      correctIndex: 0,
      explanation: "Because A",
    },
  ],
};

export function mockAnthropicModule() {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: JSON.stringify(fakeQuizPayload) }],
        }),
      },
    })),
  };
}

export { fakeQuizPayload };
