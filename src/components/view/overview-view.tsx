import { useEffect, useRef } from "react";
import { css } from "../../../styled-system/css";
import { hstack } from "../../../styled-system/patterns";
import type { BdlIr, Def } from "../../types/bdl";
import { type NamespaceNode, createNamespaceTree } from "../sidebar/fns";
import { DefCard } from "../def-detail";

// ============================================================================
// Types
// ============================================================================

interface OverviewViewProps {
  ir: BdlIr;
  scrollToPath: string | null;
  onSelectDef: (defPath: string) => void;
}

interface Section {
  path: string;
  name: string;
  level: number;
  defs: Array<{ path: string; def: Def; name: string }>;
}

// ============================================================================
// Exported Component
// ============================================================================

export const OverviewView = ({
  ir,
  scrollToPath,
  onSelectDef,
}: OverviewViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const tree = createNamespaceTree(ir);
  const sections = flattenTree(tree);

  // Scroll to section when scrollToPath changes
  useEffect(() => {
    if (scrollToPath !== null && sectionRefs.current.has(scrollToPath)) {
      const element = sectionRefs.current.get(scrollToPath);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [scrollToPath]);

  const setSectionRef = (path: string) => (el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(path, el);
    } else {
      sectionRefs.current.delete(path);
    }
  };

  return (
    <div ref={containerRef} className={containerStyle}>
      <h1 className={titleStyle}>All Definitions</h1>

      {sections.map((section) => (
        <section
          key={section.path}
          ref={setSectionRef(section.path)}
          id={`section-${section.path.replace(/\./g, "-")}`}
          className={sectionStyle}
        >
          {/* Section header */}
          <div className={sectionHeaderStyle}>
            <h2 className={sectionTitleStyle(section.level)}>{section.name}</h2>
            {section.defs.length > 0 && (
              <span className={badgeStyle}>{section.defs.length}</span>
            )}
          </div>

          {/* Definitions grid */}
          {section.defs.length > 0 && (
            <div className={gridStyle}>
              {section.defs.map(({ path, def, name }) => (
                <DefCard
                  key={path}
                  def={def}
                  name={name}
                  onClick={() => onSelectDef(path)}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {sections.length === 0 && (
        <div className={emptyStyle}>No definitions found</div>
      )}
    </div>
  );
};

// ============================================================================
// Helpers
// ============================================================================

const flattenTree = (node: NamespaceNode, level: number = 0): Section[] => {
  const sections: Section[] = [];

  // Only add this node as a section if it has defs
  if (node.defs.length > 0) {
    sections.push({
      path: node.fullPath,
      name: node.fullPath || "Root",
      level,
      defs: node.defs,
    });
  }

  // Recurse into children
  const sortedChildren = Array.from(node.children.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [, child] of sortedChildren) {
    sections.push(...flattenTree(child, level + 1));
  }

  return sections;
};

// ============================================================================
// Styles
// ============================================================================

const containerStyle = css({
  p: "4",
  maxWidth: "1400px",
  md: { p: "6" },
});

const titleStyle = css({
  fontSize: "xl",
  fontWeight: "bold",
  color: "text",
  mb: "4",
  md: {
    fontSize: "2xl",
    mb: "6",
  },
});

const sectionStyle = css({
  mb: "8",
  scrollMarginTop: "24px",
});

const sectionHeaderStyle = hstack({
  gap: "2",
  mb: "4",
  pb: "2",
  borderBottom: "1px solid #E8E4DE",
});

const sectionTitleStyle = (level: number) =>
  css({
    fontSize: level === 0 ? "lg" : "md",
    fontWeight: "600",
    color: "text.secondary",
    fontFamily: "mono",
  });

const badgeStyle = css({
  fontSize: "xs",
  color: "text.placeholder",
  bg: "bg.muted",
  px: "2",
  py: "0.5",
  borderRadius: "full",
});

const gridStyle = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "3",
  md: {
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  },
});

const emptyStyle = css({
  color: "text.placeholder",
  textAlign: "center",
  py: "12",
});
