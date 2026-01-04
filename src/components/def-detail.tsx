import { css } from "../../styled-system/css";
import type { Def, StructField, EnumItem, UnionItem, OneofItem, BdlIr } from "../types/bdl";
import { TypeDisplay } from "./type-display";

interface DefDetailProps {
  defPath: string;
  ir: BdlIr;
  onTypeClick?: (typePath: string) => void;
}

const AttributeList = ({ attributes }: { attributes: Record<string, string> }) => {
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
          <span className={css({ color: "#D97706", fontWeight: "500" })}>@{key}</span>
          {value && (
            <span className={css({ color: "#A8A29E" })}>
              = "{value}"
            </span>
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
        borderBottom: "1px solid #F5F3EF",
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
      <td className={css({ py: "3", px: "4", fontFamily: "mono", fontSize: "sm" })}>
        <TypeDisplay type={field.fieldType} onTypeClick={onTypeClick} />
      </td>
      <td className={css({ py: "3", px: "4", fontSize: "sm", color: "#78716C" })}>
        {field.attributes["description"] || field.attributes["doc"] || ""}
      </td>
    </tr>
  );
};

const StructView = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Struct" }>;
  onTypeClick?: (typePath: string) => void;
}) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      {def.fields.length > 0 ? (
        <table className={css({ width: "100%", borderCollapse: "collapse" })}>
          <thead>
            <tr
              className={css({
                borderBottom: "1px solid #E8E4DE",
                bg: "#FAF9F6",
              })}
            >
              <th
                className={css({
                  textAlign: "left",
                  py: "3",
                  px: "4",
                  fontWeight: "600",
                  color: "#44403C",
                  fontSize: "xs",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                })}
              >
                Field
              </th>
              <th
                className={css({
                  textAlign: "left",
                  py: "3",
                  px: "4",
                  fontWeight: "600",
                  color: "#44403C",
                  fontSize: "xs",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                })}
              >
                Type
              </th>
              <th
                className={css({
                  textAlign: "left",
                  py: "3",
                  px: "4",
                  fontWeight: "600",
                  color: "#44403C",
                  fontSize: "xs",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                })}
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {def.fields.map((field) => (
              <FieldRow key={field.name} field={field} onTypeClick={onTypeClick} />
            ))}
          </tbody>
        </table>
      ) : (
        <div className={css({ color: "#A8A29E", fontStyle: "italic", py: "4" })}>
          No fields
        </div>
      )}
    </div>
  );
};

const EnumView = ({ def }: { def: Extract<Def, { type: "Enum" }> }) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      <div className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
        {def.items.map((item: EnumItem) => (
          <div
            key={item.name}
            className={css({
              py: "2.5",
              px: "4",
              bg: "#FAF9F6",
              borderRadius: "lg",
              fontFamily: "mono",
              fontSize: "sm",
              border: "1px solid #F5F3EF",
              transition: "all 0.15s ease",
              _hover: { border: "1px solid #E8E4DE" },
            })}
          >
            <span className={css({ color: "#059669", fontWeight: "500" })}>{item.name}</span>
            {item.attributes["description"] && (
              <span className={css({ color: "#A8A29E", ml: "3", fontFamily: "sans-serif" })}>
                {item.attributes["description"]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const UnionView = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Union" }>;
  onTypeClick?: (typePath: string) => void;
}) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
        {def.items.map((item: UnionItem) => (
          <div
            key={item.name}
            className={css({
              p: "4",
              bg: "#FDFCFA",
              borderRadius: "xl",
              border: "1px solid #E8E4DE",
              transition: "all 0.15s ease",
              _hover: { boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" },
            })}
          >
            <div
              className={css({
                fontWeight: "600",
                color: "#1C1917",
                mb: "3",
                pb: "2",
                borderBottom: "1px solid #F5F3EF",
              })}
            >
              {item.name}
            </div>
            {item.fields.length > 0 && (
              <table className={css({ width: "100%", borderCollapse: "collapse" })}>
                <tbody>
                  {item.fields.map((field) => (
                    <FieldRow key={field.name} field={field} onTypeClick={onTypeClick} />
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

const OneofView = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Oneof" }>;
  onTypeClick?: (typePath: string) => void;
}) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      <div className={css({ display: "flex", flexWrap: "wrap", gap: "3" })}>
        {def.items.map((item: OneofItem, index: number) => (
          <div
            key={index}
            className={css({
              py: "2",
              px: "4",
              bg: "rgba(217, 119, 6, 0.06)",
              borderRadius: "lg",
              border: "1px solid rgba(217, 119, 6, 0.15)",
              fontFamily: "mono",
              fontSize: "sm",
              transition: "all 0.15s ease",
              _hover: { border: "1px solid rgba(217, 119, 6, 0.3)", bg: "rgba(217, 119, 6, 0.1)" },
            })}
          >
            <TypeDisplay type={item.itemType} onTypeClick={onTypeClick} />
          </div>
        ))}
      </div>
    </div>
  );
};

const ProcView = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Proc" }>;
  onTypeClick?: (typePath: string) => void;
}) => {
  const httpMethod = def.attributes["http.method"];
  const httpPath = def.attributes["http.path"];

  return (
    <div>
      <AttributeList attributes={def.attributes} />

      {(httpMethod || httpPath) && (
        <div
          className={css({
            mb: "5",
            p: "4",
            bg: "#FAF9F6",
            borderRadius: "xl",
            border: "1px solid #E8E4DE",
            display: "flex",
            alignItems: "center",
            gap: "3",
          })}
        >
          {httpMethod && (
            <span
              className={css({
                px: "3",
                py: "1",
                bg: getMethodColor(httpMethod),
                color: "white",
                fontWeight: "600",
                fontSize: "xs",
                borderRadius: "md",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              })}
            >
              {httpMethod}
            </span>
          )}
          {httpPath && (
            <span className={css({ fontFamily: "mono", fontSize: "sm", color: "#44403C" })}>
              {httpPath}
            </span>
          )}
        </div>
      )}

      <div className={css({ display: "grid", gap: "5" })}>
        <div className={css({ p: "4", bg: "#FDFCFA", borderRadius: "xl", border: "1px solid", borderColor: "#F5F3EF" })}>
          <h4
            className={css({
              fontSize: "xs",
              fontWeight: "600",
              color: "#78716C",
              mb: "2",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            })}
          >
            Input
          </h4>
          <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
            <TypeDisplay type={def.inputType} onTypeClick={onTypeClick} />
          </div>
        </div>

        <div className={css({ p: "4", bg: "#FDFCFA", borderRadius: "xl", border: "1px solid #F5F3EF" })}>
          <h4
            className={css({
              fontSize: "xs",
              fontWeight: "600",
              color: "#78716C",
              mb: "2",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            })}
          >
            Output
          </h4>
          <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
            <TypeDisplay type={def.outputType} onTypeClick={onTypeClick} />
          </div>
        </div>

        {def.errorType && (
          <div className={css({ p: "4", bg: "#FEF2F2", borderRadius: "xl", border: "1px solid #FECACA" })}>
            <h4
              className={css({
                fontSize: "xs",
                fontWeight: "600",
                color: "#DC2626",
                mb: "2",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              })}
            >
              Error
            </h4>
            <div className={css({ fontFamily: "mono", fontSize: "sm" })}>
              <TypeDisplay type={def.errorType} onTypeClick={onTypeClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomView = ({
  def,
  onTypeClick,
}: {
  def: Extract<Def, { type: "Custom" }>;
  onTypeClick?: (typePath: string) => void;
}) => {
  return (
    <div>
      <AttributeList attributes={def.attributes} />
      <div className={css({ fontFamily: "mono", fontSize: "sm", p: "4", bg: "#FAF9F6", borderRadius: "xl", border: "1px solid #F5F3EF" })}>
        <span className={css({ color: "#A8A29E" })}>type alias of </span>
        <TypeDisplay type={def.originalType} onTypeClick={onTypeClick} />
      </div>
    </div>
  );
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

export const DefDetail = ({ defPath, ir, onTypeClick }: DefDetailProps) => {
  const def = ir.defs[defPath];

  if (!def) {
    return (
      <div className={css({ p: "6", color: "#A8A29E" })}>
        Definition not found: {defPath}
      </div>
    );
  }

  const description = def.attributes["description"] || def.attributes["doc"];
  const badgeStyle = typeBadgeColors[def.type];

  return (
    <div className={css({ p: "8", maxWidth: "1000px" })}>
      <div className={css({ mb: "6" })}>
        <div className={css({ display: "flex", alignItems: "center", gap: "3", mb: "3" })}>
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
          <span className={css({ fontSize: "xs", color: "#A8A29E", fontFamily: "mono" })}>
            {defPath}
          </span>
        </div>
        <h2
          className={css({
            fontSize: "2xl",
            fontWeight: "700",
            color: "#1C1917",
            letterSpacing: "-0.02em",
          })}
        >
          {def.name}
        </h2>
        {description && (
          <p className={css({ mt: "3", color: "#78716C", lineHeight: "1.6" })}>{description}</p>
        )}
      </div>

      <div
        className={css({
          border: "1px solid #E8E4DE",
          borderRadius: "2xl",
          overflow: "hidden",
          bg: "white",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        })}
      >
        <div className={css({ p: "5" })}>
          {def.type === "Struct" && <StructView def={def} onTypeClick={onTypeClick} />}
          {def.type === "Enum" && <EnumView def={def} />}
          {def.type === "Union" && <UnionView def={def} onTypeClick={onTypeClick} />}
          {def.type === "Oneof" && <OneofView def={def} onTypeClick={onTypeClick} />}
          {def.type === "Proc" && <ProcView def={def} onTypeClick={onTypeClick} />}
          {def.type === "Custom" && <CustomView def={def} onTypeClick={onTypeClick} />}
        </div>
      </div>
    </div>
  );
};
