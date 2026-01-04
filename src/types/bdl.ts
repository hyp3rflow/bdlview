// Re-export types from @disjukr/bdl
export type {
  BdlIr,
  Module,
  Import,
  ImportItem,
  Def,
  Custom,
  Enum,
  Oneof,
  Proc,
  Struct,
  Union,
  EnumItem,
  OneofItem,
  StructField,
  Type,
  Plain,
  Array,
  Dictionary,
  UnionItem,
} from "@disjukr/bdl/ir";

// BdlStandard types (not exported from package, so defined here)
export interface BdlStandard {
  name?: string;
  description?: string;
  stitches?: string[];
  primitives: Record<string, Primitive>;
  attributes?: Record<AttributeSlot, Attribute[]>;
}

export interface Primitive {
  name?: string;
  description?: string;
}

export interface Attribute {
  key: string;
  name?: string;
  description?: string;
}

export type AttributeSlot =
  | "bdl.module"
  | "bdl.enum"
  | "bdl.enum.item"
  | "bdl.import"
  | "bdl.oneof"
  | "bdl.oneof.item"
  | "bdl.proc"
  | "bdl.custom"
  | "bdl.struct"
  | "bdl.struct.field"
  | "bdl.union"
  | "bdl.union.item";
