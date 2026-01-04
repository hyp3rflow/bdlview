import { useState } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack, wrap } from "../../styled-system/patterns";
import type {
  Def,
  StructField,
  EnumItem,
  UnionItem,
  OneofItem,
  BdlIr,
} from "../types/bdl";
import { TypeDisplay } from "./type-display";
import { TabButton } from "./tab";
import { BdlCode } from "../shared/bdl-syntax-highlighter";
import { getTypeTag } from "../shared/type-tag";

// ============================================================================
// Types
// ============================================================================

interface DefDetailProps {
  defPath: string;
  ir: BdlIr;
  onTypeClick?: (typePath: string) => void;
  moduleText?: string | null;
  isLoadingModuleText?: boolean;
}

interface DefCardProps {
  def: Def;
  name: string;
  onClick: () => void;
}

type TabType = "definition" | "source";

// ============================================================================
// Exported Components
// ============================================================================

export const DefDetail = ({
  defPath,
  ir,
  onTypeClick,
  moduleText,
  isLoadingModuleText,
}: DefDetailProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("definition");
  const def = ir.defs[defPath];

  if (!def) {
    return (
      <div className={css({ p: "6", color: "text.placeholder" })}>
        Definition not found: {defPath}
      </div>
    );
  }

  const description = def.attributes["description"] || def.attributes["doc"];
  const badgeStyle = typeBadgeColors[def.type];

  return (
    <div
      className={css({
        p: "4",
        maxWidth: "1400px",
        md: { p: "8" },
      })}
    >
      <div className={css({ mb: "6" })}>
        <div className={hstack({ gap: "3", mb: "3" })}>
          <span
            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
            className={css({
              px: "3",
              py: "1",
              fontSize: "xs",
              fontWeight: "600",
              borderRadius: "full",
              letterSpacing: "0.02em",
            })}
          >
            {typeLabels[def.type]}
          </span>
          <span
            className={css({
              fontSize: "xs",
              color: "text.placeholder",
              fontFamily: "mono",
            })}
          >
            {defPath}
          </span>
        </div>
        <h2
          className={css({
            fontSize: "2xl",
            fontWeight: "700",
            color: "text",
            letterSpacing: "-0.02em",
          })}
        >
          {def.name}
        </h2>
        {description && (
          <p className={css({ mt: "3", color: "text.muted", lineHeight: "1.6" })}>
            {description}
          </p>
        )}
      </div>

      {/* Tabs */}
      {moduleText !== undefined && (
        <div
          className={hstack({
            gap: "2",
            borderBottom: "1px solid #E8E4DE",
            mb: "4",
          })}
        >
          <TabButton
            active={activeTab === "definition"}
            onClick={() => setActiveTab("definition")}
          >
            Definition
          </TabButton>
          <TabButton
            active={activeTab === "source"}
            onClick={() => setActiveTab("source")}
          >
            Source
          </TabButton>
        </div>
      )}

      {activeTab === "definition" ? (
        <div className={cardStyle}>
          {def.type === "Struct" && (
            <StructView def={def} onTypeClick={onTypeClick} ir={ir} />
          )}
          {def.type === "Enum" && <EnumView def={def} />}
          {def.type === "Union" && (
            <UnionView def={def} onTypeClick={onTypeClick} ir={ir} />
          )}
          {def.type === "Oneof" && (
            <OneofView def={def} onTypeClick={onTypeClick} />
          )}
          {def.type === "Proc" && (
            <ProcView def={def} onTypeClick={onTypeClick} />
          )}
          {def.type === "Custom" && (
            <CustomView def={def} onTypeClick={onTypeClick} />
          )}
        </div>
      ) : (
        <div className={cardStyle}>
          <div className={css({ p: "5" })}>
            {isLoadingModuleText ? (
              <div
                className={css({
                  textAlign: "center",
                  py: "8",
                  color: "text.placeholder",
                })}
              >
                Loading source...
              </div>
            ) : moduleText ? (
              <pre className={codeBlockStyle}>
                <code>
                  <BdlCode code={moduleText} />
                </code>
              </pre>
            ) : (
              <div
                className={css({
                  textAlign: "center",
                  py: "8",
                  color: "text.placeholder",
                })}
              >
                Source not available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const DefCard = ({ def, name, onClick }: DefCardProps) => {
  const { tag, color, bgColor } = getTypeTag(def);
  const description = def.attributes["description"] || def.attributes["doc"];

  return (
    <button
      onClick={onClick}
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "2",
        p: "4",
        bg: "bg.card",
        border: "1px solid #E8E4DE",
        borderRadius: "lg",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        _hover: {
          border: "1px solid #D97706",
          bg: "accent.lightest",
        },
      })}
    >
      <div className={hstack({ gap: "2", width: "100%" })}>
        <span
          className={css({
            fontSize: "10px",
            fontWeight: "600",
            fontFamily: "mono",
            px: "1.5",
            py: "0.5",
            borderRadius: "sm",
          })}
          style={{ color, backgroundColor: bgColor }}
        >
          {tag}
        </span>
        <span className={css({ fontWeight: "500", color: "text.secondary", flex: 1 })}>
          {name}
        </span>
      </div>
      {description && (
        <div
          className={css({
            fontSize: "sm",
            color: "text.muted",
            lineHeight: "1.4",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineClamp: 2,
          })}
        >
          {description}
        </div>
      )}
    </button>
  );
};

export const AttributeList = ({
  attributes,
}: {
  attributes: Record<string, string>;
}) => {
  const entries = Object.entries(attributes);
  if (entries.length === 0) return null;

  return (
    <div className={css({ mb: "4" })}>
      {entries.map(([key, value]) => (
        <div
          key={key}
          className={hstack({
            gap: "1",
            display: "inline-flex",
            fontSize: "sm",
            color: "text.muted",
            mb: "1.5",
            mr: "3",
          })}
        >
          <span className={css({ color: "accent", fontWeight: "500" })}>
            @{key}
          </span>
          {value && (
            <span className={css({ color: "text.placeholder" })}>= "{value}"</span>
          )}
        </div>
      ))}
    </div>
  );
};

export const FieldRow = ({
  field,
  onTypeClick,
  ir,
}: {
  field: StructField;
  onTypeClick?: (typePath: string) => void;
  ir: BdlIr;
}) => {
  const typeInfo = getTypeAlias(field.fieldType, ir);
  const description =
    field.attributes["description"] || field.attributes["doc"];

  return (
    <>
      <tr className={tableRowStyle(!!description)}>
        <td className={fieldNameCell}>
          {field.name}
          {field.optional && (
            <span className={css({ color: "text.placeholder", ml: "1" })}>?</span>
          )}
        </td>
        <td className={typeCell}>
          <div className={css({ display: "inline-block" })}>
            <TypeDisplay type={field.fieldType} onTypeClick={onTypeClick} />
            {typeInfo.isAlias && typeInfo.originalType && (
              <div className={css({ fontSize: "xs", color: "text.placeholder", mt: "1" })}>
                <span className={css({ mr: "1" })}>≈</span>
                <TypeDisplay
                  type={typeInfo.originalType}
                  onTypeClick={onTypeClick}
                />
              </div>
            )}
          </div>
        </td>
      </tr>
      {description && (
        <tr className={descriptionRowStyle}>
          <td colSpan={2} className={descriptionCell}>
            {description}
          </td>
        </tr>
      )}
    </>
  );
};

export const StructView = ({
  def,
  onTypeClick,
  ir,
}: {
  def: Extract<Def, { type: "Struct" }>;
  onTypeClick?: (typePath: string) => void;
  ir: BdlIr;
}) => {
  const hasAttributes = Object.keys(def.attributes).length > 0;

  return (
    <div>
      {hasAttributes && (
        <div className={css({ px: "5", pt: "5" })}>
          <AttributeList attributes={def.attributes} />
        </div>
      )}
      {def.fields.length > 0 ? (
        <div className={css({ overflowX: "auto" })}>
          <table className={tableStyle}>
            <thead>
              <tr className={tableHeaderStyle}>
                <th className={fieldHeaderCell}>Field</th>
                <th className={typeHeaderCell}>Type</th>
              </tr>
            </thead>
            <tbody>
              {def.fields.map((field) => (
                <FieldRow
                  key={field.name}
                  field={field}
                  onTypeClick={onTypeClick}
                  ir={ir}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={emptyFieldsStyle}>No fields</div>
      )}
    </div>
  );
};

export const EnumView = ({ def }: { def: Extract<Def, { type: "Enum" }> }) => {
  const hasAttributes = Object.keys(def.attributes).length > 0;

  return (
    <div className={css({ p: "5" })}>
      {hasAttributes && <AttributeList attributes={def.attributes} />}
      <div className={wrap({ gap: "2" })}>
        {def.items.map((item: EnumItem) => (
          <div key={item.name} className={enumItemStyle}>
            <span className={css({ color: "type.enum", fontWeight: "500" })}>
              {item.name}
            </span>
            {item.attributes["description"] && (
              <span
                className={css({
                  color: "text.placeholder",
                  ml: "3",
                  fontFamily: "sans-serif",
                })}
              >
                {item.attributes["description"]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const UnionView = ({
  def,
  onTypeClick,
  ir,
}: {
  def: Extract<Def, { type: "Union" }>;
  onTypeClick?: (typePath: string) => void;
  ir: BdlIr;
}) => {
  const hasAttributes = Object.keys(def.attributes).length > 0;

  return (
    <div className={css({ p: "5" })}>
      {hasAttributes && <AttributeList attributes={def.attributes} />}
      <div className={vstack({ gap: "3" })}>
        {def.items.map((item: UnionItem) => (
          <div key={item.name} className={unionItemStyle}>
            <div className={unionItemHeaderStyle}>
              <span className={unionDot} />
              <span className={unionItemName}>{item.name}</span>
              {item.attributes["description"] && (
                <span className={css({ color: "text.placeholder", fontSize: "xs", ml: "2" })}>
                  — {item.attributes["description"]}
                </span>
              )}
            </div>

            {item.fields.length > 0 ? (
              <div className={css({ overflowX: "auto" })}>
                <table className={tableStyle}>
                  <thead>
                    <tr className={css({ bg: "bg.subtle" })}>
                      <th className={subFieldHeaderCell}>Field</th>
                      <th className={subTypeHeaderCell}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.fields.map((field) => (
                      <FieldRow
                        key={field.name}
                        field={field}
                        onTypeClick={onTypeClick}
                        ir={ir}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={noFieldsStyle}>No fields</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const OneofView = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Oneof" }>;
  onTypeClick?: (typePath: string) => void;
}) => {
  const hasAttributes = Object.keys(def.attributes).length > 0;

  return (
    <div className={css({ p: "5" })}>
      {hasAttributes && <AttributeList attributes={def.attributes} />}
      <div className={wrap({ gap: "3" })}>
        {def.items.map((item: OneofItem, index: number) => (
          <div key={index} className={oneofItemStyle}>
            <TypeDisplay type={item.itemType} onTypeClick={onTypeClick} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProcView = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Proc" }>;
  onTypeClick?: (typePath: string) => void;
}) => {
  const httpMethod = def.attributes["http.method"];
  const httpPath = def.attributes["http.path"];
  const hasAttributes = Object.keys(def.attributes).length > 0;

  return (
    <div className={css({ overflowX: "auto", p: "5" })}>
      {hasAttributes && <AttributeList attributes={def.attributes} />}

      {(httpMethod || httpPath) && (
        <div className={httpInfoStyle}>
          {httpMethod && (
            <span
              className={css({
                px: "3",
                py: "1",
                color: "white",
                fontWeight: "600",
                fontSize: "xs",
                borderRadius: "md",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              })}
              style={{ backgroundColor: getMethodColor(httpMethod) }}
            >
              {httpMethod}
            </span>
          )}
          {httpPath && (
            <span className={css({ fontFamily: "mono", fontSize: "sm", color: "text.secondary" })}>
              {httpPath}
            </span>
          )}
        </div>
      )}

      <div className={css({ display: "grid", gap: "5" })}>
        <div className={ioBlockStyle}>
          <h4 className={ioLabelStyle}>Input</h4>
          <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
            <TypeDisplay type={def.inputType} onTypeClick={onTypeClick} />
          </div>
        </div>

        <div className={ioBlockStyle}>
          <h4 className={ioLabelStyle}>Output</h4>
          <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
            <TypeDisplay type={def.outputType} onTypeClick={onTypeClick} />
          </div>
        </div>

        {def.errorType && (
          <div className={errorBlockStyle}>
            <h4 className={errorLabelStyle}>Error</h4>
            <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
              <TypeDisplay type={def.errorType} onTypeClick={onTypeClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CustomView = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Custom" }>;
  onTypeClick?: (typePath: string) => void;
}) => {
  const hasAttributes = Object.keys(def.attributes).length > 0;

  return (
    <div className={css({ p: "5" })}>
      {hasAttributes && <AttributeList attributes={def.attributes} />}
      <div className={customTypeStyle}>
        <span className={css({ color: "text.placeholder" })}>type alias of </span>
        <TypeDisplay type={def.originalType} onTypeClick={onTypeClick} />
      </div>
    </div>
  );
};

export const getMethodColor = (method: string): string => {
  switch (method.toUpperCase()) {
    case "GET":
      return "var(--colors-http-get)";
    case "POST":
      return "var(--colors-http-post)";
    case "PUT":
      return "var(--colors-http-put)";
    case "PATCH":
      return "var(--colors-http-patch)";
    case "DELETE":
      return "var(--colors-http-delete)";
    default:
      return "var(--colors-http-default)";
  }
};

export const typeLabels: Record<Def["type"], string> = {
  Struct: "Struct",
  Enum: "Enum",
  Union: "Union",
  Oneof: "Oneof",
  Proc: "Procedure",
  Custom: "Custom Type",
};

export const typeBadgeColors: Record<
  Def["type"],
  { bg: string; color: string }
> = {
  Struct: { bg: "var(--colors-type-struct-bg)", color: "var(--colors-type-struct)" },
  Enum: { bg: "var(--colors-type-enum-bg)", color: "var(--colors-type-enum)" },
  Union: { bg: "var(--colors-type-union-bg)", color: "var(--colors-type-union)" },
  Oneof: { bg: "var(--colors-type-oneof-bg)", color: "var(--colors-type-oneof)" },
  Proc: { bg: "var(--colors-type-proc-bg)", color: "var(--colors-type-proc)" },
  Custom: { bg: "var(--colors-type-custom-bg)", color: "var(--colors-type-custom)" },
};

// ============================================================================
// Helpers
// ============================================================================

const getTypeAlias = (
  type: StructField["fieldType"],
  ir: BdlIr,
): { isAlias: boolean; originalType?: StructField["fieldType"] } => {
  if (type.type === "Plain") {
    const typePath = type.valueTypePath;
    const def = ir.defs[typePath];
    if (def && def.type === "Custom") {
      return { isAlias: true, originalType: def.originalType };
    }
  }
  return { isAlias: false };
};

// ============================================================================
// Styles
// ============================================================================

const cardStyle = css({
  border: "1px solid #E8E4DE",
  borderRadius: "2xl",
  overflow: "hidden",
  bg: "white",
  boxShadow: "card",
});

const codeBlockStyle = css({
  fontFamily: "mono",
  fontSize: "sm",
  lineHeight: "1.6",
  bg: "bg.subtle",
  p: "5",
  borderRadius: "lg",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowX: "auto",
  margin: 0,
});

const tableStyle = css({
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "500px",
});

const tableHeaderStyle = css({
  borderBottom: "1px solid #E8E4DE",
  bg: "bg",
});

const fieldHeaderCell = css({
  textAlign: "left",
  py: "3",
  px: "5",
  fontWeight: "600",
  color: "text.secondary",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

const typeHeaderCell = css({
  textAlign: "right",
  py: "3",
  px: "5",
  fontWeight: "600",
  color: "text.secondary",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

const tableRowStyle = (hasDescription: boolean) =>
  css({
    borderBottom: hasDescription ? "none" : "1px solid #F5F3EF",
    transition: "background 0.15s ease",
    _hover: { bg: "bg.subtle" },
  });

const descriptionRowStyle = css({
  borderBottom: "1px solid #F5F3EF",
  transition: "background 0.15s ease",
  _hover: { bg: "bg.subtle" },
});

const fieldNameCell = css({
  py: "3",
  px: "5",
  fontWeight: "500",
  color: "text",
  fontFamily: "mono",
  fontSize: "xs",
  md: { fontSize: "sm" },
});

const typeCell = css({
  py: "3",
  px: "5",
  fontFamily: "mono",
  fontSize: "xs",
  textAlign: "right",
  md: { fontSize: "sm" },
});

const descriptionCell = css({
  py: "2",
  px: "5",
  fontSize: "xs",
  color: "text.muted",
  bg: "bg.subtle",
  md: { fontSize: "sm" },
});

const emptyFieldsStyle = css({
  color: "text.placeholder",
  fontStyle: "italic",
  py: "4",
  px: "5",
});

const enumItemStyle = css({
  py: "2.5",
  px: "4",
  bg: "bg",
  borderRadius: "lg",
  fontFamily: "mono",
  fontSize: "sm",
  border: "1px solid #F5F3EF",
  transition: "all 0.15s ease",
  _hover: { border: "1px solid #E8E4DE" },
});

const unionItemStyle = css({
  border: "1px solid #E8E4DE",
  borderRadius: "xl",
  overflow: "hidden",
  bg: "white",
  transition: "all 0.2s ease",
  _hover: {
    boxShadow: "hover",
    borderColor: "border.accent",
  },
});

const unionItemHeaderStyle = css({
  px: "4",
  py: "3",
  bg: "linear-gradient(135deg, rgba(217, 119, 6, 0.04) 0%, rgba(217, 119, 6, 0.08) 100%)",
  borderBottom: "1px solid #F5F3EF",
  display: "flex",
  alignItems: "center",
  gap: "2",
});

const unionDot = css({
  display: "inline-block",
  w: "2",
  h: "2",
  borderRadius: "full",
  bg: "accent",
  flexShrink: 0,
});

const unionItemName = css({
  fontWeight: "600",
  color: "text",
  fontFamily: "mono",
  fontSize: "sm",
});

const subFieldHeaderCell = css({
  textAlign: "left",
  py: "2.5",
  px: "5",
  fontWeight: "600",
  color: "text.muted",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

const subTypeHeaderCell = css({
  textAlign: "right",
  py: "2.5",
  px: "5",
  fontWeight: "600",
  color: "text.muted",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

const noFieldsStyle = css({
  py: "6",
  px: "4",
  textAlign: "center",
  color: "text.placeholder",
  fontSize: "sm",
  fontStyle: "italic",
});

const oneofItemStyle = css({
  py: "2",
  px: "4",
  bg: "accent.lightest",
  borderRadius: "lg",
  border: "1px solid rgba(217, 119, 6, 0.1)",
  fontFamily: "mono",
  fontSize: "sm",
  transition: "all 0.15s ease",
  _hover: {
    border: "1px solid rgba(217, 119, 6, 0.3)",
    bg: "accent.light",
  },
});

const httpInfoStyle = css({
  mb: "5",
  p: "4",
  bg: "bg",
  borderRadius: "xl",
  border: "1px solid #E8E4DE",
  display: "flex",
  alignItems: "center",
  gap: "3",
});

const ioBlockStyle = css({
  p: "4",
  bg: "bg.subtle",
  borderRadius: "xl",
  border: "1px solid #F5F3EF",
});

const ioLabelStyle = css({
  fontSize: "xs",
  fontWeight: "600",
  color: "text.muted",
  mb: "2",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

const errorBlockStyle = css({
  p: "4",
  bg: "error.bg",
  borderRadius: "xl",
  border: "1px solid #FECACA",
});

const errorLabelStyle = css({
  fontSize: "xs",
  fontWeight: "600",
  color: "error",
  mb: "2",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

const customTypeStyle = css({
  fontFamily: "mono",
  fontSize: "sm",
  p: "4",
  bg: "bg",
  borderRadius: "xl",
  border: "1px solid #F5F3EF",
});
