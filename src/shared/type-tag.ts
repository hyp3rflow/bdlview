import type { Def } from "../types/bdl";

// ============================================================================
// Types
// ============================================================================

export interface TypeTag {
  tag: string;
  label: string;
  color: string;
  bgColor: string;
}

// ============================================================================
// Exported Function
// ============================================================================

export const getTypeTag = (def: Def): TypeTag => {
  switch (def.type) {
    case "Proc":
      return {
        tag: "rpc",
        label: "Procedure",
        color: "var(--colors-type-proc)",
        bgColor: "var(--colors-type-proc-bg)",
      };
    case "Struct":
      return {
        tag: "s",
        label: "Struct",
        color: "var(--colors-type-struct)",
        bgColor: "var(--colors-type-struct-bg)",
      };
    case "Enum":
      return {
        tag: "e",
        label: "Enum",
        color: "var(--colors-type-enum)",
        bgColor: "var(--colors-type-enum-bg)",
      };
    case "Union":
      return {
        tag: "u",
        label: "Union",
        color: "var(--colors-type-union)",
        bgColor: "var(--colors-type-union-bg)",
      };
    case "Oneof":
      return {
        tag: "o",
        label: "Oneof",
        color: "var(--colors-type-oneof)",
        bgColor: "var(--colors-type-oneof-bg)",
      };
    case "Custom":
      return {
        tag: "t",
        label: "Type",
        color: "var(--colors-type-custom)",
        bgColor: "var(--colors-type-custom-bg)",
      };
  }
};
