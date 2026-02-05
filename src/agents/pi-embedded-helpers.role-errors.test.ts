import type { AssistantMessage } from "@mariozechner/pi-ai";
import { describe, expect, it } from "vitest";
import { formatAssistantErrorText } from "./pi-embedded-helpers.js";

describe("formatAssistantErrorText - role error handling", () => {
  const makeAssistantError = (errorMessage: string): AssistantMessage =>
    ({
      stopReason: "error",
      errorMessage,
    }) as AssistantMessage;

  describe("role ordering errors", () => {
    it("returns friendly message for 'roles must alternate'", () => {
      const msg = makeAssistantError('messages: roles must alternate between "user" and "assistant"');
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("Message ordering conflict");
      expect(result).toContain("/new");
    });

    it("returns friendly message for 'incorrect role information'", () => {
      const msg = makeAssistantError("incorrect role information");
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("Message ordering conflict");
    });

    it("handles JSON-wrapped role ordering errors", () => {
      const msg = makeAssistantError(
        '{"error":{"message":"messages.1.role: incorrect role information"}}',
      );
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("Message ordering conflict");
    });
  });

  describe("unsupported role type errors", () => {
    it("returns friendly message for 'unexpected role'", () => {
      const msg = makeAssistantError('400 Bad Request: Unexpected role "developer"');
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("does not support the message role type");
      expect(result).toContain("/new");
      expect(result).not.toContain("ordering conflict");
    });

    it("returns friendly message for 'invalid role'", () => {
      const msg = makeAssistantError("invalid role: system");
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("does not support the message role type");
    });

    it("returns friendly message for 'unsupported role'", () => {
      const msg = makeAssistantError("unsupported role type: developer");
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("does not support the message role type");
    });

    it("returns friendly message for 'role not supported'", () => {
      const msg = makeAssistantError("role 'system' not supported by this model");
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("does not support the message role type");
    });

    it("handles JSON-wrapped unsupported role errors", () => {
      const msg = makeAssistantError(
        '{"type":"error","error":{"message":"Unexpected role \\"developer\\""}}',
      );
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("does not support the message role type");
    });
  });

  describe("generic role errors (fallback)", () => {
    it("returns friendly message for generic '400 role' error", () => {
      const msg = makeAssistantError("400 Bad Request: role field is required");
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("Role-related API error");
      expect(result).toContain("/new");
    });

    it("handles '400' and 'role' separated by text", () => {
      const msg = makeAssistantError("400 Bad Request: invalid message role");
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("Role-related API error");
    });
  });

  describe("non-role errors should not trigger role handling", () => {
    it("does not trigger on unrelated 400 errors", () => {
      const msg = makeAssistantError("400 Bad Request: invalid parameter");
      const result = formatAssistantErrorText(msg);
      expect(result).not.toContain("role");
      expect(result).not.toContain("ordering conflict");
    });

    it("does not trigger on errors mentioning 'role' without 400", () => {
      const msg = makeAssistantError("The model's role in this conversation is unclear");
      const result = formatAssistantErrorText(msg);
      expect(result).not.toContain("ordering conflict");
      expect(result).not.toContain("does not support");
    });

    it("does not confuse context overflow with role errors", () => {
      const msg = makeAssistantError("request_too_large");
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("Context overflow");
      expect(result).not.toContain("role");
    });
  });

  describe("error precedence and specificity", () => {
    it("prioritizes 'unsupported role' over generic 400 role", () => {
      const msg = makeAssistantError("400 Bad Request: Unexpected role 'developer'");
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("does not support the message role type");
      expect(result).not.toContain("ordering conflict");
      expect(result).not.toContain("Role-related API error");
    });

    it("prioritizes 'ordering conflict' over generic 400 role", () => {
      const msg = makeAssistantError("400 Bad Request: roles must alternate");
      const result = formatAssistantErrorText(msg);
      expect(result).toContain("Message ordering conflict");
      expect(result).not.toContain("does not support");
      expect(result).not.toContain("Role-related API error");
    });
  });
});
