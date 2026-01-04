import { css } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";

// ============================================================================
// Types
// ============================================================================

interface BdlCodeProps {
  code: string;
  selectedLines?: [number, number]; // 1-based line range [start, end] (inclusive)
}

// ============================================================================
// Exported Component
// ============================================================================

/**
 * BDL Code Component
 * Displays BDL code with syntax highlighting and line numbers
 *
 * Color scheme uses CSS variables from the palette:
 * - Keywords: type.struct (purple)
 * - Primitives: type.proc (blue)
 * - Types: type.oneof (cyan)
 * - Attributes: accent (orange)
 * - Strings: type.enum (green)
 * - Numbers: type.union (orange-red)
 * - Comments: text.placeholder (gray)
 * - Punctuation: text.muted (gray)
 */
export const BdlCode = ({ code, selectedLines }: BdlCodeProps) => {
  const lines = code.split("\n");

  const isLineSelected = (lineNumber: number): boolean => {
    if (!selectedLines) return false;
    const [start, end] = selectedLines;
    return lineNumber >= start && lineNumber <= end;
  };

  return (
    <>
      {lines.map((line, lineIndex) => {
        const lineNumber = lineIndex + 1;
        const tokens = tokenizeLine(line);
        const isSelected = isLineSelected(lineNumber);

        return (
          <div
            key={lineIndex}
            className={hstack({ minHeight: "1.5em" })}
            style={{
              backgroundColor: isSelected
                ? "var(--colors-accent-light)"
                : undefined,
            }}
          >
            <span
              className={lineNumberStyle}
              style={{
                backgroundColor: isSelected
                  ? "var(--colors-accent-lighter)"
                  : undefined,
                fontWeight: isSelected ? "600" : undefined,
              }}
            >
              {lineNumber}
            </span>
            <span className={css({ flex: 1 })}>
              {tokens.length > 0 ? tokens : " "}
            </span>
          </div>
        );
      })}
    </>
  );
};

// ============================================================================
// Deprecated Export
// ============================================================================

/**
 * @deprecated Use BdlCode component instead
 */
export const highlightBdlCode = (
  code: string,
  showLineNumbers: boolean = false,
): React.ReactNode[] => {
  const lines = code.split("\n");

  return lines.map((line, lineIndex) => {
    const tokens = tokenizeLine(line);

    if (showLineNumbers) {
      return (
        <div key={lineIndex} className={hstack({ minHeight: "1.5em" })}>
          <span className={lineNumberStyle}>{lineIndex + 1}</span>
          <span className={css({ flex: 1 })}>
            {tokens.length > 0 ? tokens : " "}
          </span>
        </div>
      );
    } else {
      return <div key={lineIndex}>{tokens.length > 0 ? tokens : " "}</div>;
    }
  });
};

// ============================================================================
// Helpers
// ============================================================================

const tokenizeLine = (line: string): React.ReactNode[] => {
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
    // Comments (// or #)
    const commentMatch = remaining.match(/^(\/\/.*|#.*)/);
    if (commentMatch) {
      addToken(commentMatch[0], commentStyle);
      remaining = remaining.slice(commentMatch[0].length);
      continue;
    }

    // Attributes (@word with optional = "value")
    const attrMatch = remaining.match(/^(@[\w.]+)(\s*=\s*"[^"]*")?/);
    if (attrMatch) {
      addToken(attrMatch[1], attributeStyle);
      if (attrMatch[2]) addToken(attrMatch[2], stringStyle);
      remaining = remaining.slice(attrMatch[0].length);
      continue;
    }

    // Keywords
    const keywordMatch = remaining.match(
      /^(struct|enum|union|oneof|proc|import|from|optional|type)\b/,
    );
    if (keywordMatch) {
      addToken(keywordMatch[0], keywordStyle);
      remaining = remaining.slice(keywordMatch[0].length);
      continue;
    }

    // Primitive types
    const primitiveMatch = remaining.match(
      /^(string|int|int32|int64|uint|uint32|uint64|float|float32|float64|bool|bytes|timestamp|duration|any|void)\b/,
    );
    if (primitiveMatch) {
      addToken(primitiveMatch[0], primitiveStyle);
      remaining = remaining.slice(primitiveMatch[0].length);
      continue;
    }

    // Strings
    const stringMatch = remaining.match(/^"[^"]*"/);
    if (stringMatch) {
      addToken(stringMatch[0], stringStyle);
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    // Numbers
    const numberMatch = remaining.match(/^\d+(\.\d+)?/);
    if (numberMatch) {
      addToken(numberMatch[0], numberStyle);
      remaining = remaining.slice(numberMatch[0].length);
      continue;
    }

    // Types (capitalized identifiers)
    const typeMatch = remaining.match(/^([A-Z][a-zA-Z0-9]*)/);
    if (typeMatch) {
      addToken(typeMatch[0], typeNameStyle);
      remaining = remaining.slice(typeMatch[0].length);
      continue;
    }

    // Punctuation
    const punctMatch = remaining.match(/^[{}[\]():,;?]/);
    if (punctMatch) {
      addToken(punctMatch[0], punctuationStyle);
      remaining = remaining.slice(punctMatch[0].length);
      continue;
    }

    // Identifiers
    const identMatch = remaining.match(/^[a-z_][a-zA-Z0-9_]*/);
    if (identMatch) {
      addToken(identMatch[0], identifierStyle);
      remaining = remaining.slice(identMatch[0].length);
      continue;
    }

    // Whitespace
    const wsMatch = remaining.match(/^\s+/);
    if (wsMatch) {
      tokens.push(<span key={key++}>{wsMatch[0]}</span>);
      remaining = remaining.slice(wsMatch[0].length);
      continue;
    }

    // Any other character
    tokens.push(<span key={key++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return tokens;
};

// ============================================================================
// Styles
// ============================================================================

const lineNumberStyle = css({
  display: "inline-block",
  width: "50px",
  textAlign: "right",
  pr: "4",
  color: "text.placeholder",
  userSelect: "none",
  flexShrink: 0,
});

const commentStyle = css({ color: "text.placeholder", fontStyle: "italic" });
const attributeStyle = css({ color: "accent" });
const stringStyle = css({ color: "type.enum" });
const keywordStyle = css({ color: "type.struct", fontWeight: "600" });
const primitiveStyle = css({ color: "type.proc" });
const numberStyle = css({ color: "type.union" });
const typeNameStyle = css({ color: "type.oneof" });
const punctuationStyle = css({ color: "text.muted" });
const identifierStyle = css({ color: "text" });
