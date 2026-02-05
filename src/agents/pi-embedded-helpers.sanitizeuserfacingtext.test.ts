import { describe, expect, it } from "vitest";
import { sanitizeUserFacingText } from "./pi-embedded-helpers.js";

describe("sanitizeUserFacingText", () => {
  it("strips final tags", () => {
    expect(sanitizeUserFacingText("<final>Hello</final>")).toBe("Hello");
    expect(sanitizeUserFacingText("Hi <final>there</final>!")).toBe("Hi there!");
  });

  it("does not clobber normal numeric prefixes", () => {
    expect(sanitizeUserFacingText("202 results found")).toBe("202 results found");
    expect(sanitizeUserFacingText("400 days left")).toBe("400 days left");
  });

  describe("role error handling", () => {
    it("sanitizes role ordering errors", () => {
      const result = sanitizeUserFacingText("400 Incorrect role information");
      expect(result).toContain("Message ordering conflict");
    });

    it("sanitizes 'roles must alternate' errors", () => {
      const result = sanitizeUserFacingText('messages: roles must alternate between "user" and "assistant"');
      expect(result).toContain("Message ordering conflict");
    });

    it("sanitizes unsupported role errors", () => {
      const result = sanitizeUserFacingText('400 Bad Request: Unexpected role "developer"');
      expect(result).toContain("does not support the message role type");
      expect(result).not.toContain("ordering conflict");
    });

    it("sanitizes invalid role errors", () => {
      const result = sanitizeUserFacingText("invalid role: system");
      expect(result).toContain("does not support the message role type");
    });

    it("sanitizes generic 400 role errors", () => {
      const result = sanitizeUserFacingText("400 Bad Request: role field is required");
      expect(result).toContain("Role-related API error");
    });

    it("does not trigger on unrelated 400 errors", () => {
      const result = sanitizeUserFacingText("400 Bad Request: invalid parameter");
      expect(result).not.toContain("role");
      expect(result).not.toContain("ordering");
    });
  });

  it("sanitizes HTTP status errors with error hints", () => {
    expect(sanitizeUserFacingText("500 Internal Server Error")).toBe(
      "HTTP 500: Internal Server Error",
    );
  });

  it("sanitizes raw API error payloads", () => {
    const raw = '{"type":"error","error":{"message":"Something exploded","type":"server_error"}}';
    expect(sanitizeUserFacingText(raw)).toBe("LLM error server_error: Something exploded");
  });

  it("collapses consecutive duplicate paragraphs", () => {
    const text = "Hello there!\n\nHello there!";
    expect(sanitizeUserFacingText(text)).toBe("Hello there!");
  });

  it("does not collapse distinct paragraphs", () => {
    const text = "Hello there!\n\nDifferent line.";
    expect(sanitizeUserFacingText(text)).toBe(text);
  });
});
