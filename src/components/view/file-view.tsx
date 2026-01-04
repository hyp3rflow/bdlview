import { useState } from "react";
import { css } from "../../../styled-system/css";
import { hstack, center } from "../../../styled-system/patterns";
import type { BdlIr, Def } from "../../types/bdl";
import { createNamespaceTree, getNodeAtPath } from "../sidebar/fns";
import { BdlCode } from "../../shared/bdl-syntax-highlighter";
import { TabButton, TabButtonGroup } from "../tab";
import {
  StructView,
  EnumView,
  UnionView,
  OneofView,
  ProcView,
  CustomView,
  typeBadgeColors,
  typeLabels,
} from "../def-detail";

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Exported Component
// ============================================================================

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
      <div className={css({ p: "6", color: "text.placeholder" })}>
        Namespace not found: {namespacePath}
      </div>
    );
  }

  const pathParts = namespacePath.split(".");
  const fileName = pathParts[pathParts.length - 1];

  return (
    <div className={containerStyle}>
      {/* Back button */}
      <div className={css({ mb: "4" })}>
        <button onClick={onBack} className={backButtonStyle}>
          <BackIcon />
          Back
        </button>
      </div>

      {/* Header */}
      <div className={css({ mb: "6" })}>
        <div className={hstack({ gap: "3", mb: "2" })}>
          <span className={fileBadgeStyle}>File</span>
          <span className={pathStyle}>{namespacePath}</span>
        </div>
        <h1 className={titleStyle}>{fileName}</h1>
        <p className={css({ mt: "1", color: "text.muted", fontSize: "sm" })}>
          {node.defs.length} definition{node.defs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tab buttons */}
      <TabButtonGroup>
        <TabButton
          active={activeTab === "definitions"}
          onClick={() => setActiveTab("definitions")}
        >
          Definitions
        </TabButton>
        <TabButton
          active={activeTab === "source"}
          onClick={() => setActiveTab("source")}
        >
          Source
        </TabButton>
      </TabButtonGroup>

      {/* Tab content */}
      {activeTab === "definitions" ? (
        <div className={css({ display: "flex", flexDirection: "column", gap: "6" })}>
          {node.defs.map(({ path, def }) => (
            <InlineDefView
              key={path}
              defPath={path}
              def={def}
              onTypeClick={onTypeClick}
              ir={ir}
            />
          ))}
        </div>
      ) : (
        <div className={cardStyle}>
          {isLoadingModuleText ? (
            <div className={center({ p: "6", color: "text.placeholder", gap: "3" })}>
              <LoadingSpinner />
              Loading source code...
            </div>
          ) : moduleText ? (
            <pre className={codeStyle}>
              <code>
                <BdlCode code={moduleText} />
              </code>
            </pre>
          ) : (
            <div className={css({ p: "6", color: "text.placeholder", textAlign: "center" })}>
              Source code not available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Internal Components
// ============================================================================

const InlineDefView = ({
  defPath,
  def,
  onTypeClick,
  ir,
}: {
  defPath: string;
  def: Def;
  onTypeClick: (typePath: string) => void;
  ir: BdlIr;
}) => {
  const description = def.attributes["description"] || def.attributes["doc"];
  const badgeStyle = typeBadgeColors[def.type];

  return (
    <div id={`def-${defPath}`} className={cardStyle}>
      {/* Header */}
      <div className={defHeaderStyle}>
        <div className={hstack({ gap: "3" })}>
          <span
            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
            className={typeBadgeStyle}
          >
            {typeLabels[def.type]}
          </span>
          <h3 className={defTitleStyle}>{def.name}</h3>
        </div>
        {description && (
          <p className={css({ fontSize: "sm", color: "text.muted" })}>
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div>
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
    </div>
  );
};

const BackIcon = () => (
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
);

const LoadingSpinner = () => (
  <div
    className={css({
      width: "20px",
      height: "20px",
      border: "2px solid #E8E4DE",
      borderTopColor: "accent",
      borderRadius: "full",
      animation: "spin 1s linear infinite",
    })}
  />
);

// ============================================================================
// Styles
// ============================================================================

const containerStyle = css({
  p: "4",
  maxWidth: "1400px",
  md: { p: "6" },
});

const backButtonStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  color: "text.muted",
  fontSize: "sm",
  cursor: "pointer",
  transition: "color 0.15s ease",
  _hover: { color: "accent" },
});

const fileBadgeStyle = css({
  px: "3",
  py: "1",
  fontSize: "xs",
  fontWeight: "600",
  borderRadius: "full",
  bg: "rgba(180, 149, 110, 0.15)",
  color: "#8B7355",
  letterSpacing: "0.02em",
});

const pathStyle = css({
  fontSize: "xs",
  color: "text.placeholder",
  fontFamily: "mono",
});

const titleStyle = css({
  fontSize: "2xl",
  fontWeight: "700",
  color: "text",
  letterSpacing: "-0.02em",
});

const cardStyle = css({
  border: "1px solid #E8E4DE",
  borderRadius: "xl",
  overflow: "hidden",
  bg: "white",
  boxShadow: "card",
});

const defHeaderStyle = css({
  p: "4",
  borderBottom: "1px solid #F5F3EF",
  bg: "bg.subtle",
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

const typeBadgeStyle = css({
  px: "2",
  py: "0.5",
  fontSize: "xs",
  fontWeight: "600",
  borderRadius: "md",
  letterSpacing: "0.02em",
});

const defTitleStyle = css({
  fontSize: "lg",
  fontWeight: "600",
  color: "text",
});

const codeStyle = css({
  p: "5",
  fontFamily: "mono",
  fontSize: "sm",
  lineHeight: "1.6",
  overflowX: "auto",
  bg: "bg.subtle",
});
