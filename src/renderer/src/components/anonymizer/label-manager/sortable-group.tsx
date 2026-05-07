import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { css } from "@/styled/css";
import { DotsSixVertical } from "phosphor-react";
import type { ReactNode } from "react";

const handle = css({
  cursor: "grab",
  color: "text.lighter",
  display: "flex",
  alignItems: "center",
  p: "0",
  bg: "transparent",
  border: "none",
  "&:hover": { color: "text.default" },
  "&:active": { cursor: "grabbing" },
});

const wrapper = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "2",
  transition: "[opacity 0.2s, box-shadow 0.2s]",
});

interface SortableGroupProps {
  id: string;
  children: ReactNode;
}

export default function SortableGroup({ id, children }: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
  };

  return (
    <div ref={setNodeRef} style={style} className={wrapper}>
      <button
        type="button"
        className={handle}
        {...attributes}
        {...listeners}
      >
        <DotsSixVertical size={20} />
      </button>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
