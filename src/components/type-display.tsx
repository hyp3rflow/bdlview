import { css } from "../../styled-system/css";
import type { Type } from "../types/bdl";

interface TypeDisplayProps {
  type: Type;
  onTypeClick?: (typePath: string) => void;
}

export const TypeDisplay = ({ type, onTypeClick }: TypeDisplayProps) => {
  const getTypeName = (typePath: string) => {
    const parts = typePath.split("/");
    return parts[parts.length - 1];
  };

  const handleClick = (typePath: string) => {
    if (onTypeClick) {
      onTypeClick(typePath);
    }
  };

  const typeStyle = css({
    color: "#D97706",
    cursor: onTypeClick ? "pointer" : "default",
    fontWeight: "500",
    transition: "all 0.15s ease",
    _hover: onTypeClick ? { color: "#B45309", textDecoration: "underline" } : {},
  });

  switch (type.type) {
    case "Plain":
      return (
        <span className={typeStyle} onClick={() => handleClick(type.valueTypePath)}>
          {getTypeName(type.valueTypePath)}
        </span>
      );
    case "Array":
      return (
        <span>
          <span className={typeStyle} onClick={() => handleClick(type.valueTypePath)}>
            {getTypeName(type.valueTypePath)}
          </span>
          <span className={css({ color: "#A8A29E" })}>[]</span>
        </span>
      );
    case "Dictionary":
      return (
        <span>
          <span className={css({ color: "#A8A29E" })}>{"{"}</span>
          <span className={typeStyle} onClick={() => handleClick(type.keyTypePath)}>
            {getTypeName(type.keyTypePath)}
          </span>
          <span className={css({ color: "#A8A29E" })}>{": "}</span>
          <span className={typeStyle} onClick={() => handleClick(type.valueTypePath)}>
            {getTypeName(type.valueTypePath)}
          </span>
          <span className={css({ color: "#A8A29E" })}>{"}"}</span>
        </span>
      );
  }
};
