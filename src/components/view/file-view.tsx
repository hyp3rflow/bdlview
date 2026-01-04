import { useState } from "react";
import { css } from "../../../styled-system/css";
import type {
  BdlIr,
  Def,
  StructField,
  EnumItem,
  UnionItem,
  OneofItem,
} from "../../types/bdl";
import { TypeDisplay } from "../type-display";
import { createNamespaceTree, getNodeAtPath } from "../sidebar";

interface FileViewProps {
  ir: BdlIr;
  namespacePath: string;
  moduleText: string | null;
  isLoadingModuleText: boolean;
  onSelectDef: (defPath: string) => void;
  onTypeClick: (typePath: string) => void;
  onBack: () => void;
}

type TabType = "definitions" | "source";

// Reuse from DefDetail
const AttributeList = ({
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
          className={css({
            fontSize: "sm",
            color: "#78716C",
            mb: "1.5",
            display: "inline-flex",
            alignItems: "center",
            gap: "1",
            mr: "3",
          })}
        >
          <span className={css({ color: "#D97706", fontWeight: "500" })}>
            @{key}
          </span>
          {value && (
            <span className={css({ color: "#A8A29E" })}>= "{value}"</span>
          )}
        </div>
      ))}
    </div>
  );
};

const FieldRow = ({
  field,
  onTypeClick,
}: {
  field: StructField;
  onTypeClick?: (typePath: string) => void;
}) => {
  return (
    <tr
      className={css({
        borderBottom: "1px solid",
        borderColor: "#F5F3EF",
        transition: "background 0.15s ease",
        _hover: { bg: "#FDFCFA" },
      })}
    >
      <td
        className={css({
          py: "3",
          px: "4",
          fontWeight: "500",
          color: "#1C1917",
          fontFamily: "mono",
          fontSize: "sm",
        })}
      >
        {field.name}
        {field.optional && (
          <span className={css({ color: "#A8A29E", ml: "1" })}>?</span>
        )}
      </td>
      <td
        className={css({
          py: "3",
          px: "4",
          fontFamily: "mono",
          fontSize: "sm",
        })}
      >
        <TypeDisplay type={field.fieldType} onTypeClick={onTypeClick} />
      </td>
      <td
        className={css({ py: "3", px: "4", fontSize: "sm", color: "#78716C" })}
      >
        {field.attributes["description"] || field.attributes["doc"] || ""}
      </td>
    </tr>
  );
};

const typeLabels: Record<Def["type"], string> = {
  Struct: "Struct",
  Enum: "Enum",
  Union: "Union",
  Oneof: "Oneof",
  Proc: "Procedure",
  Custom: "Custom Type",
};

const typeBadgeColors: Record<Def["type"], { bg: string; color: string }> = {
  Struct: { bg: "rgba(124, 58, 237, 0.1)", color: "#7C3AED" },
  Enum: { bg: "rgba(5, 150, 105, 0.1)", color: "#059669" },
  Union: { bg: "rgba(217, 119, 6, 0.1)", color: "#D97706" },
  Oneof: { bg: "rgba(37, 99, 235, 0.1)", color: "#2563EB" },
  Proc: { bg: "rgba(217, 119, 6, 0.1)", color: "#D97706" },
  Custom: { bg: "rgba(120, 113, 108, 0.1)", color: "#78716C" },
};

const getMethodColor = (method: string): string => {
  switch (method.toUpperCase()) {
    case "GET":
      return "#059669";
    case "POST":
      return "#D97706";
    case "PUT":
      return "#2563EB";
    case "PATCH":
      return "#7C3AED";
    case "DELETE":
      return "#DC2626";
    default:
      return "#78716C";
  }
};

// Inline definition view (compact version for file view)
const InlineDefView = ({
  defPath,
  def,
  onTypeClick,
}: {
  defPath: string;
  def: Def;
  onTypeClick: (typePath: string) => void;
}) => {
  const description = def.attributes["description"] || def.attributes["doc"];
  const badgeStyle = typeBadgeColors[def.type];

  return (
    <div
      id={`def-${defPath}`}
      className={css({
        border: "1px solid",
        borderColor: "#E8E4DE",
        borderRadius: "xl",
        overflow: "hidden",
        bg: "white",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      })}
    >
      {/* Header */}
      <div
        className={css({
          p: "4",
          borderBottom: "1px solid",
          borderColor: "#F5F3EF",
          bg: "#FDFCFA",
        })}
      >
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "3",
            mb: "1",
          })}
        >
          <span
            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
            className={css({
              px: "2",
              py: "0.5",
              fontSize: "xs",
              fontWeight: "600",
              borderRadius: "md",
              letterSpacing: "0.02em",
            })}
          >
            {typeLabels[def.type]}
          </span>
          <h3
            className={css({
              fontSize: "lg",
              fontWeight: "600",
              color: "#1C1917",
            })}
          >
            {def.name}
          </h3>
        </div>
        {description && (
          <p className={css({ fontSize: "sm", color: "#78716C", mt: "1" })}>
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className={css({ p: "4" })}>
        {def.type === "Struct" && (
          <StructContent def={def} onTypeClick={onTypeClick} />
        )}
        {def.type === "Enum" && <EnumContent def={def} />}
        {def.type === "Union" && (
          <UnionContent def={def} onTypeClick={onTypeClick} />
        )}
        {def.type === "Oneof" && (
          <OneofContent def={def} onTypeClick={onTypeClick} />
        )}
        {def.type === "Proc" && (
          <ProcContent def={def} onTypeClick={onTypeClick} />
        )}
        {def.type === "Custom" && (
          <CustomContent def={def} onTypeClick={onTypeClick} />
        )}
      </div>
    </div>
  );
};

const StructContent = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Struct" }>;
  onTypeClick: (p: string) => void;
}) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      {def.fields.length > 0 ? (
        <table className={css({ width: "100%", borderCollapse: "collapse" })}>
          <thead>
            <tr
              className={css({
                borderBottom: "1px solid",
                borderColor: "#E8E4DE",
                bg: "#FAF9F6",
              })}
            >
              <th
                className={css({
                  textAlign: "left",
                  py: "2",
                  px: "3",
                  fontWeight: "600",
                  color: "#44403C",
                  fontSize: "xs",
                  textTransform: "uppercase",
                })}
              >
                Field
              </th>
              <th
                className={css({
                  textAlign: "left",
                  py: "2",
                  px: "3",
                  fontWeight: "600",
                  color: "#44403C",
                  fontSize: "xs",
                  textTransform: "uppercase",
                })}
              >
                Type
              </th>
              <th
                className={css({
                  textAlign: "left",
                  py: "2",
                  px: "3",
                  fontWeight: "600",
                  color: "#44403C",
                  fontSize: "xs",
                  textTransform: "uppercase",
                })}
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {def.fields.map((field) => (
              <FieldRow
                key={field.name}
                field={field}
                onTypeClick={onTypeClick}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div className={css({ color: "#A8A29E", fontStyle: "italic" })}>
          No fields
        </div>
      )}
    </div>
  );
};

const EnumContent = ({ def }: { def: Extract<Def, { type: "Enum" }> }) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
        {def.items.map((item: EnumItem) => (
          <div
            key={item.name}
            className={css({
              py: "1.5",
              px: "3",
              bg: "#FAF9F6",
              borderRadius: "md",
              fontFamily: "mono",
              fontSize: "sm",
              border: "1px solid",
              borderColor: "#F5F3EF",
            })}
          >
            <span className={css({ color: "#059669", fontWeight: "500" })}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const UnionContent = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Union" }>;
  onTypeClick: (p: string) => void;
}) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      <div
        className={css({ display: "flex", flexDirection: "column", gap: "3" })}
      >
        {def.items.map((item: UnionItem) => (
          <div
            key={item.name}
            className={css({
              p: "3",
              bg: "#FDFCFA",
              borderRadius: "lg",
              border: "1px solid",
              borderColor: "#E8E4DE",
            })}
          >
            <div
              className={css({ fontWeight: "600", color: "#1C1917", mb: "2" })}
            >
              {item.name}
            </div>
            {item.fields.length > 0 && (
              <table
                className={css({ width: "100%", borderCollapse: "collapse" })}
              >
                <tbody>
                  {item.fields.map((field) => (
                    <FieldRow
                      key={field.name}
                      field={field}
                      onTypeClick={onTypeClick}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const OneofContent = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Oneof" }>;
  onTypeClick: (p: string) => void;
}) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
        {def.items.map((item: OneofItem, index: number) => (
          <div
            key={index}
            className={css({
              py: "1.5",
              px: "3",
              bg: "rgba(217, 119, 6, 0.06)",
              borderRadius: "md",
              border: "1px solid",
              borderColor: "rgba(217, 119, 6, 0.15)",
              fontFamily: "mono",
              fontSize: "sm",
            })}
          >
            <TypeDisplay type={item.itemType} onTypeClick={onTypeClick} />
          </div>
        ))}
      </div>
    </div>
  );
};

const ProcContent = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Proc" }>;
  onTypeClick: (p: string) => void;
}) => {
  const httpMethod = def.attributes["http.method"];
  const httpPath = def.attributes["http.path"];

  return (
    <div>
      <AttributeList attributes={def.attributes} />
      {(httpMethod || httpPath) && (
        <div
          className={css({
            mb: "4",
            display: "flex",
            alignItems: "center",
            gap: "2",
          })}
        >
          {httpMethod && (
            <span
              className={css({
                px: "2",
                py: "0.5",
                bg: getMethodColor(httpMethod),
                color: "white",
                fontWeight: "600",
                fontSize: "xs",
                borderRadius: "sm",
                textTransform: "uppercase",
              })}
            >
              {httpMethod}
            </span>
          )}
          {httpPath && (
            <span
              className={css({
                fontFamily: "mono",
                fontSize: "sm",
                color: "#44403C",
              })}
            >
              {httpPath}
            </span>
          )}
        </div>
      )}
      <div className={css({ display: "flex", gap: "4", flexWrap: "wrap" })}>
        <div
          className={css({
            flex: "1",
            minWidth: "200px",
            p: "3",
            bg: "#FDFCFA",
            borderRadius: "lg",
            border: "1px solid",
            borderColor: "#F5F3EF",
          })}
        >
          <div
            className={css({
              fontSize: "xs",
              fontWeight: "600",
              color: "#78716C",
              mb: "1",
              textTransform: "uppercase",
            })}
          >
            Input
          </div>
          <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
            <TypeDisplay type={def.inputType} onTypeClick={onTypeClick} />
          </div>
        </div>
        <div
          className={css({
            flex: "1",
            minWidth: "200px",
            p: "3",
            bg: "#FDFCFA",
            borderRadius: "lg",
            border: "1px solid",
            borderColor: "#F5F3EF",
          })}
        >
          <div
            className={css({
              fontSize: "xs",
              fontWeight: "600",
              color: "#78716C",
              mb: "1",
              textTransform: "uppercase",
            })}
          >
            Output
          </div>
          <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
            <TypeDisplay type={def.outputType} onTypeClick={onTypeClick} />
          </div>
        </div>
        {def.errorType && (
          <div
            className={css({
              flex: "1",
              minWidth: "200px",
              p: "3",
              bg: "#FEF2F2",
              borderRadius: "lg",
              border: "1px solid",
              borderColor: "#FECACA",
            })}
          >
            <div
              className={css({
                fontSize: "xs",
                fontWeight: "600",
                color: "#DC2626",
                mb: "1",
                textTransform: "uppercase",
              })}
            >
              Error
            </div>
            <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
              <TypeDisplay type={def.errorType} onTypeClick={onTypeClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomContent = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Custom" }>;
  onTypeClick: (p: string) => void;
}) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
        <span className={css({ color: "#A8A29E" })}>type alias of </span>
        <TypeDisplay type={def.originalType} onTypeClick={onTypeClick} />
      </div>
    </div>
  );
};

// BDL syntax highlighter
const highlightBdlCode = (code: string): React.ReactNode[] => {
  const lines = code.split("\n");

  return lines.map((line, lineIndex) => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    const addToken = (text: string, className: string) => {
      tokens.push(
        <span key={key++} className={className}>
          {text}
        </span>,
      );
    };

    while (remaining.length > 0) {
      const commentMatch = remaining.match(/^(\/\/.*|#.*)/);
      if (commentMatch) {
        addToken(
          commentMatch[0],
          css({ color: "#A8A29E", fontStyle: "italic" }),
        );
        remaining = remaining.slice(commentMatch[0].length);
        continue;
      }

      const attrMatch = remaining.match(/^(@[\w.]+)(\s*=\s*"[^"]*")?/);
      if (attrMatch) {
        addToken(attrMatch[1], css({ color: "#D97706" }));
        if (attrMatch[2]) addToken(attrMatch[2], css({ color: "#059669" }));
        remaining = remaining.slice(attrMatch[0].length);
        continue;
      }

      const keywordMatch = remaining.match(
        /^(struct|enum|union|oneof|proc|import|from|optional|type)\b/,
      );
      if (keywordMatch) {
        addToken(keywordMatch[0], css({ color: "#7C3AED", fontWeight: "600" }));
        remaining = remaining.slice(keywordMatch[0].length);
        continue;
      }

      const primitiveMatch = remaining.match(
        /^(string|int|int32|int64|uint|uint32|uint64|float|float32|float64|bool|bytes|timestamp|duration|any|void)\b/,
      );
      if (primitiveMatch) {
        addToken(primitiveMatch[0], css({ color: "#2563EB" }));
        remaining = remaining.slice(primitiveMatch[0].length);
        continue;
      }

      const stringMatch = remaining.match(/^"[^"]*"/);
      if (stringMatch) {
        addToken(stringMatch[0], css({ color: "#059669" }));
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      const numberMatch = remaining.match(/^\d+(\.\d+)?/);
      if (numberMatch) {
        addToken(numberMatch[0], css({ color: "#EA580C" }));
        remaining = remaining.slice(numberMatch[0].length);
        continue;
      }

      const typeMatch = remaining.match(/^([A-Z][a-zA-Z0-9]*)/);
      if (typeMatch) {
        addToken(typeMatch[0], css({ color: "#0891B2" }));
        remaining = remaining.slice(typeMatch[0].length);
        continue;
      }

      const punctMatch = remaining.match(/^[{}[\]():,;?]/);
      if (punctMatch) {
        addToken(punctMatch[0], css({ color: "#78716C" }));
        remaining = remaining.slice(punctMatch[0].length);
        continue;
      }

      const identMatch = remaining.match(/^[a-z_][a-zA-Z0-9_]*/);
      if (identMatch) {
        addToken(identMatch[0], css({ color: "#1C1917" }));
        remaining = remaining.slice(identMatch[0].length);
        continue;
      }

      const wsMatch = remaining.match(/^\s+/);
      if (wsMatch) {
        tokens.push(<span key={key++}>{wsMatch[0]}</span>);
        remaining = remaining.slice(wsMatch[0].length);
        continue;
      }

      tokens.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return (
      <div
        key={lineIndex}
        className={css({ display: "flex", minHeight: "1.5em" })}
      >
        <span
          className={css({
            display: "inline-block",
            width: "50px",
            textAlign: "right",
            pr: "4",
            color: "#A8A29E",
            userSelect: "none",
            flexShrink: 0,
          })}
        >
          {lineIndex + 1}
        </span>
        <span className={css({ flex: 1 })}>
          {tokens.length > 0 ? tokens : " "}
        </span>
      </div>
    );
  });
};

export const FileView = ({
  ir,
  namespacePath,
  moduleText,
  isLoadingModuleText,
  onTypeClick,
  onBack,
}: FileViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("definitions");

  const tree = createNamespaceTree(ir);
  const node = getNodeAtPath(tree, namespacePath);

  if (!node) {
    return (
      <div className={css({ p: "6", color: "#A8A29E" })}>
        Namespace not found: {namespacePath}
      </div>
    );
  }

  const pathParts = namespacePath.split(".");
  const fileName = pathParts[pathParts.length - 1];

  return (
    <div className={css({ p: "6", maxWidth: "1200px" })}>
      {/* Back button and breadcrumb */}
      <div className={css({ mb: "4" })}>
        <button
          onClick={onBack}
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            color: "#78716C",
            fontSize: "sm",
            cursor: "pointer",
            transition: "color 0.15s ease",
            _hover: { color: "#D97706" },
          })}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </div>

      {/* Header */}
      <div className={css({ mb: "6" })}>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "3",
            mb: "2",
          })}
        >
          <span
            className={css({
              px: "3",
              py: "1",
              fontSize: "xs",
              fontWeight: "600",
              borderRadius: "full",
              bg: "rgba(180, 149, 110, 0.15)",
              color: "#8B7355",
              letterSpacing: "0.02em",
            })}
          >
            File
          </span>
          <span
            className={css({
              fontSize: "xs",
              color: "#A8A29E",
              fontFamily: "mono",
            })}
          >
            {namespacePath}
          </span>
        </div>
        <h1
          className={css({
            fontSize: "2xl",
            fontWeight: "700",
            color: "#1C1917",
            letterSpacing: "-0.02em",
          })}
        >
          {fileName}
        </h1>
        <p className={css({ mt: "1", color: "#78716C", fontSize: "sm" })}>
          {node.defs.length} definition{node.defs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tab buttons */}
      <div
        className={css({
          display: "flex",
          gap: "1",
          mb: "6",
          borderBottom: "1px solid",
          borderColor: "#E8E4DE",
        })}
      >
        <button
          onClick={() => setActiveTab("definitions")}
          className={css({
            px: "4",
            py: "2",
            fontSize: "sm",
            fontWeight: activeTab === "definitions" ? "600" : "normal",
            color: activeTab === "definitions" ? "#D97706" : "#78716C",
            borderBottom: "2px solid",
            borderColor:
              activeTab === "definitions" ? "#D97706" : "transparent",
            cursor: "pointer",
            transition: "all 0.15s ease",
            mb: "-1px",
            _hover: {
              color: activeTab === "definitions" ? "#D97706" : "#44403C",
            },
          })}
        >
          Definitions
        </button>
        <button
          onClick={() => setActiveTab("source")}
          className={css({
            px: "4",
            py: "2",
            fontSize: "sm",
            fontWeight: activeTab === "source" ? "600" : "normal",
            color: activeTab === "source" ? "#D97706" : "#78716C",
            borderBottom: "2px solid",
            borderColor: activeTab === "source" ? "#D97706" : "transparent",
            cursor: "pointer",
            transition: "all 0.15s ease",
            mb: "-1px",
            _hover: { color: activeTab === "source" ? "#D97706" : "#44403C" },
          })}
        >
          Source
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "definitions" ? (
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "6",
          })}
        >
          {node.defs.map(({ path, def }) => (
            <InlineDefView
              key={path}
              defPath={path}
              def={def}
              onTypeClick={onTypeClick}
            />
          ))}
        </div>
      ) : (
        <div
          className={css({
            border: "1px solid",
            borderColor: "#E8E4DE",
            borderRadius: "2xl",
            overflow: "hidden",
            bg: "white",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          })}
        >
          {isLoadingModuleText ? (
            <div
              className={css({
                p: "6",
                color: "#A8A29E",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3",
              })}
            >
              <div
                className={css({
                  width: "20px",
                  height: "20px",
                  border: "2px solid #E8E4DE",
                  borderTopColor: "#D97706",
                  borderRadius: "full",
                  animation: "spin 1s linear infinite",
                })}
              />
              Loading source code...
            </div>
          ) : moduleText ? (
            <pre
              className={css({
                p: "5",
                fontFamily: "mono",
                fontSize: "sm",
                lineHeight: "1.6",
                overflowX: "auto",
                bg: "#FDFCFA",
              })}
            >
              <code>{highlightBdlCode(moduleText)}</code>
            </pre>
          ) : (
            <div
              className={css({ p: "6", color: "#A8A29E", textAlign: "center" })}
            >
              Source code not available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
