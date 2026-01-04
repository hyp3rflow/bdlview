import { css } from "../../styled-system/css";
import type { Type } from "../types/bdl";

// ============================================================================
// Types
// ============================================================================

interface TypeDisplayProps {
  type: Type;
  onTypeClick?: (typePath: string) => void;
}

// ============================================================================
// Exported Component
// ============================================================================

export const TypeDisplay = ({ type, onTypeClick }: TypeDisplayProps) => {
  const renderTypePath = (typePath: string) => {
    const namespace = getTypeNamespace(typePath);
    const typeName = getTypeName(typePath);

    return (
      <span className={typeStyle} onClick={() => handleClick(typePath)}>
        {namespace && <span className={namespaceStyle}>{namespace}.</span>}
        {typeName}
      </span>
    );
  };

  const handleClick = (typePath: string) => {
    if (onTypeClick) {
      onTypeClick(typePath);
    }
  };

  switch (type.type) {
    case "Plain":
      return renderTypePath(type.valueTypePath);
    case "Array":
      return (
        <span>
          {renderTypePath(type.valueTypePath)}
          <span className={punctuationStyle}>[]</span>
        </span>
      );
    case "Dictionary":
      return (
        <span>
          <span className={punctuationStyle}>{"{"}</span>
          {renderTypePath(type.keyTypePath)}
          <span className={punctuationStyle}>{": "}</span>
          {renderTypePath(type.valueTypePath)}
          <span className={punctuationStyle}>{"}"}</span>
        </span>
      );
  }
};

// ============================================================================
// Helpers
// ============================================================================

const getTypeName = (typePath: string) => {
  const parts = typePath.split("/");
  return parts[parts.length - 1];
};

const getTypeNamespace = (typePath: string) => {
  const parts = typePath.split("/");
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join(".");
};

const typeStyle = css({
  color: "accent",
  cursor: "pointer",
  fontWeight: "500",
  transition: "all 0.15s ease",
  _hover: { color: "accent.hover", textDecoration: "underline" },
});

const namespaceStyle = css({
  color: "text.placeholder",
  fontSize: "0.9em",
  fontWeight: "normal",
});

const punctuationStyle = css({ color: "text.placeholder" });
