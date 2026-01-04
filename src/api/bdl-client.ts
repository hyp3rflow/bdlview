import type { BdlIr } from "@disjukr/bdl/ir";
import type { BdlStandard } from "../types/bdl";

// ============================================================================
// Types
// ============================================================================

export interface BdlClient {
  baseUrl: string;
  getModules(): Promise<string[]>;
  getModuleText(modulePath: string): Promise<string>;
  getStandards(): Promise<string[]>;
  getStandard(standardId: string): Promise<BdlStandard>;
  getStandardIr(standardId: string): Promise<BdlIr>;
}

// ============================================================================
// Exported Function
// ============================================================================

export function createBdlClient(baseUrl: string): BdlClient {
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  return {
    baseUrl: normalizedBaseUrl,

    async getModules(): Promise<string[]> {
      const response = await fetch(`${normalizedBaseUrl}/bdl/modules`);
      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }
      return response.json();
    },

    async getModuleText(modulePath: string): Promise<string> {
      const response = await fetch(
        `${normalizedBaseUrl}/bdl/modules/${encodeURIComponent(modulePath)}/text`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch module text: ${response.statusText}`,
        );
      }
      return response.json();
    },

    async getStandards(): Promise<string[]> {
      const response = await fetch(`${normalizedBaseUrl}/bdl/standards`);
      if (!response.ok) {
        throw new Error(`Failed to fetch standards: ${response.statusText}`);
      }
      return response.json();
    },

    async getStandard(standardId: string): Promise<BdlStandard> {
      const response = await fetch(
        `${normalizedBaseUrl}/bdl/standards/${encodeURIComponent(standardId)}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch standard: ${response.statusText}`);
      }
      return response.json();
    },

    async getStandardIr(standardId: string): Promise<BdlIr> {
      const response = await fetch(
        `${normalizedBaseUrl}/bdl/standards/${encodeURIComponent(standardId)}/ir`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch standard IR: ${response.statusText}`);
      }
      return response.json();
    },
  };
}
