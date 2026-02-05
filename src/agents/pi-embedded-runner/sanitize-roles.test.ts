import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { describe, expect, it } from "vitest";
import { sanitizeMessageRolesForModel } from "./google.js";

describe("sanitizeMessageRolesForModel", () => {
  // Helper to create a message with a specific role
  const makeMessage = (role: string, content = "test"): AgentMessage =>
    ({
      role,
      content,
    }) as unknown as AgentMessage;

  describe("Anthropic (Claude) - only user and assistant", () => {
    it("should keep user and assistant messages", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("assistant", "Hi there"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "anthropic-messages");

      expect(result).toHaveLength(2);
      expect((result[0] as { role: string }).role).toBe("user");
      expect((result[1] as { role: string }).role).toBe("assistant");
    });

    it("should filter out developer role", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("developer", "System instruction"),
        makeMessage("assistant", "Hi there"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "anthropic-messages");

      expect(result).toHaveLength(2);
      expect((result[0] as { role: string }).role).toBe("user");
      expect((result[1] as { role: string }).role).toBe("assistant");
    });

    it("should filter out system role", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("system", "System prompt"),
        makeMessage("assistant", "Hi there"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "anthropic-messages");

      expect(result).toHaveLength(2);
      expect((result[0] as { role: string }).role).toBe("user");
      expect((result[1] as { role: string }).role).toBe("assistant");
    });

    it("should filter out tool role", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("tool", "Tool result"),
        makeMessage("assistant", "Hi there"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "anthropic-messages");

      expect(result).toHaveLength(2);
      expect((result[0] as { role: string }).role).toBe("user");
      expect((result[1] as { role: string }).role).toBe("assistant");
    });
  });

  describe("Google Gemini - user, assistant, and tool", () => {
    it("should keep user, assistant, and tool messages", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("assistant", "Hi"),
        makeMessage("tool", "Tool result"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "google-gemini");

      expect(result).toHaveLength(3);
      expect((result[0] as { role: string }).role).toBe("user");
      expect((result[1] as { role: string }).role).toBe("assistant");
      expect((result[2] as { role: string }).role).toBe("tool");
    });

    it("should filter out developer role", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("developer", "Developer instruction"),
        makeMessage("assistant", "Hi"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "google-gemini");

      expect(result).toHaveLength(2);
      expect((result[0] as { role: string }).role).toBe("user");
      expect((result[1] as { role: string }).role).toBe("assistant");
    });

    it("should filter out system role", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("system", "System prompt"),
        makeMessage("assistant", "Hi"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "google-gemini");

      expect(result).toHaveLength(2);
    });

    it("should work with google-gemini-preview API", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("developer", "Developer instruction"),
        makeMessage("tool", "Tool result"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "google-gemini-preview");

      expect(result).toHaveLength(2);
      expect((result[0] as { role: string }).role).toBe("user");
      expect((result[1] as { role: string }).role).toBe("tool");
    });
  });

  describe("OpenAI and others - all roles allowed", () => {
    it("should keep all role types for OpenAI", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("system", "System prompt"),
        makeMessage("developer", "Developer instruction"),
        makeMessage("assistant", "Hi"),
        makeMessage("tool", "Tool result"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "openai-responses");

      expect(result).toHaveLength(5);
    });

    it("should keep all role types for unknown API", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("system", "System prompt"),
        makeMessage("developer", "Developer instruction"),
        makeMessage("assistant", "Hi"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "unknown-api");

      expect(result).toHaveLength(4);
    });

    it("should keep all role types when API is null", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("developer", "Developer instruction"),
      ];

      const result = sanitizeMessageRolesForModel(messages, null);

      expect(result).toHaveLength(2);
    });

    it("should keep all role types when API is undefined", () => {
      const messages = [
        makeMessage("user", "Hello"),
        makeMessage("developer", "Developer instruction"),
      ];

      const result = sanitizeMessageRolesForModel(messages);

      expect(result).toHaveLength(2);
    });
  });

  describe("Edge cases", () => {
    it("should handle messages without role field", () => {
      const messages = [
        { content: "test" } as unknown as AgentMessage,
        makeMessage("user", "Hello"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "anthropic-messages");

      // Messages without role should pass through
      expect(result).toHaveLength(2);
    });

    it("should handle empty message array", () => {
      const result = sanitizeMessageRolesForModel([], "anthropic-messages");

      expect(result).toHaveLength(0);
    });

    it("should preserve message content and other fields", () => {
      const messages = [
        {
          role: "user",
          content: "Hello world",
          extra: "metadata",
        } as unknown as AgentMessage,
      ];

      const result = sanitizeMessageRolesForModel(messages, "anthropic-messages");

      expect(result).toHaveLength(1);
      expect((result[0] as { content: string }).content).toBe("Hello world");
      expect((result[0] as { extra: string }).extra).toBe("metadata");
    });

    it("should handle messages with undefined role", () => {
      const messages = [
        { role: undefined, content: "test" } as unknown as AgentMessage,
        makeMessage("user", "Hello"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "anthropic-messages");

      // undefined role should pass through
      expect(result).toHaveLength(2);
    });

    it("should handle complex mixed scenario", () => {
      const messages = [
        makeMessage("user", "1"),
        makeMessage("developer", "2"),
        makeMessage("assistant", "3"),
        makeMessage("system", "4"),
        makeMessage("user", "5"),
        makeMessage("tool", "6"),
      ];

      const result = sanitizeMessageRolesForModel(messages, "anthropic-messages");

      // Only user and assistant should remain
      expect(result).toHaveLength(3);
      expect((result[0] as { role: string }).role).toBe("user");
      expect((result[1] as { role: string }).role).toBe("assistant");
      expect((result[2] as { role: string }).role).toBe("user");
    });
  });
});

