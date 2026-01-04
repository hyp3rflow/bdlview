import { useEffect, useRef } from "react";
import { css } from "../../../styled-system/css";
import type { BdlIr, Def } from "../../types/bdl";
import { type NamespaceNode, createNamespaceTree } from "../sidebar";

interface OverviewViewProps {
  ir: BdlIr;
  scrollToPath: string | null;
  onSelectDef: (defPath: string) => void;
}

const getTypeTag = (
  def: Def,
): { tag: string; label: string; color: string; bgColor: string } => {
  switch (def.type) {
    case "Proc":
      return {
        tag: "rpc",
        label: "Procedure",
        color: "#2563EB",
        bgColor: "#EFF6FF",
      };
    case "Struct":
      return {
        tag: "s",
        label: "Struct",
        color: "#7C3AED",
        bgColor: "#F5F3FF",
      };
    case "Enum":
      return { tag: "e", label: "Enum", color: "#059669", bgColor: "#ECFDF5" };
    case "Union":
      return { tag: "u", label: "Union", color: "#EA580C", bgColor: "#FFF7ED" };
    case "Oneof":
      return { tag: "o", label: "Oneof", color: "#0891B2", bgColor: "#ECFEFF" };
    case "Custom":
      return { tag: "t", label: "Type", color: "#78716C", bgColor: "#F5F5F4" };
  }
};

// Flatten namespace tree into sections
interface Section {
  path: string;
  name: string;
  level: number;
  defs: Array<{ path: string; def: Def; name: string }>;
}

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
    <div ref={containerRef} className={css({ p: "6", maxWidth: "1400px" })}>
      <h1
        className={css({
          fontSize: "2xl",
          fontWeight: "bold",
          color: "#1C1917",
          mb: "6",
        })}
      >
        All Definitions
      </h1>

      {sections.map((section) => (
        <section
          key={section.path}
          ref={setSectionRef(section.path)}
          id={`section-${section.path.replace(/\./g, "-")}`}
          className={css({
            mb: "8",
            scrollMarginTop: "24px",
          })}
        >
          {/* Section header */}
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "2",
              mb: "4",
              pb: "2",
              borderBottom: "1px solid #E8E4DE",
            })}
          >
            <h2
              className={css({
                fontSize: section.level === 0 ? "lg" : "md",
                fontWeight: "600",
                color: "#44403C",
                fontFamily: "mono",
              })}
            >
              {section.name}
            </h2>
            {section.defs.length > 0 && (
              <span
                className={css({
                  fontSize: "xs",
                  color: "#A8A29E",
                  bg: "#F5F3EF",
                  px: "2",
                  py: "0.5",
                  borderRadius: "full",
                })}
              >
                {section.defs.length}
              </span>
            )}
          </div>

          {/* Definitions grid */}
          {section.defs.length > 0 && (
            <div
              className={css({
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "3",
              })}
            >
              {section.defs.map(({ path, def, name }) => {
                const { tag, color, bgColor } = getTypeTag(def);
                const description =
                  def.attributes["description"] || def.attributes["doc"];

                return (
                  <button
                    key={path}
                    onClick={() => onSelectDef(path)}
                    className={css({
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "2",
                      p: "4",
                      bg: "#FFFFFF",
                      border: "1px solid #E8E4DE",
                      borderRadius: "lg",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                      _hover: {
                        border: "1px solid #D97706",
                        bg: "rgba(217, 119, 6, 0.04)",
                      },
                    })}
                  >
                    <div
                      className={css({
                        display: "flex",
                        alignItems: "center",
                        gap: "2",
                        width: "100%",
                      })}
                    >
                      <span
                        className={css({
                          fontSize: "10px",
                          fontWeight: "600",
                          fontFamily: "mono",
                          color: color,
                          bg: bgColor,
                          px: "1.5",
                          py: "0.5",
                          borderRadius: "sm",
                        })}
                      >
                        {tag}
                      </span>
                      <span
                        className={css({
                          fontWeight: "500",
                          color: "#44403C",
                          flex: 1,
                        })}
                      >
                        {name}
                      </span>
                    </div>
                    {description && (
                      <div
                        className={css({
                          fontSize: "sm",
                          color: "#78716C",
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
              })}
            </div>
          )}
        </section>
      ))}

      {sections.length === 0 && (
        <div
          className={css({
            color: "#A8A29E",
            textAlign: "center",
            py: "12",
          })}
        >
          No definitions found
        </div>
      )}
    </div>
  );
};
