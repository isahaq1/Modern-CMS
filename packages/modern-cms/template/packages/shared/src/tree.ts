import { nanoid } from "nanoid";
import { getComponentDefinition } from "./components.js";
import type { PageNode } from "./schema/pageNode.js";

export function createNode(type: string, id?: string): PageNode {
  const def = getComponentDefinition(type);
  if (!def) throw new Error(`Unknown component type: ${type}`);
  const node: PageNode = {
    id: id ?? nanoid(10),
    type,
    props: structuredClone(def.defaultProps),
    style: structuredClone(def.defaultStyle),
    children: [],
  };
  // A Container's children are one "column" node per column — each independently
  // droppable — rather than a single flat list. Seed them up front so a freshly
  // dropped Container is immediately usable.
  if (type === "container") {
    const count = Math.max(1, Number(node.props.columns) || 1);
    node.children = Array.from({ length: count }, () => createNode("column"));
  }
  // A Header's zone count is adjustable (like a Container's columns) but starts with
  // the common 3-zone layout — logo start, links centered, end free for a CTA — so a
  // freshly dropped Header is immediately usable, not N empty boxes.
  if (type === "header") {
    node.children = buildHeaderZones();
  }
  // A Grid's children are one "gridCell" node per row×column slot — seed them up
  // front (same reasoning as Container above) so a freshly dropped Grid shows its
  // full rows×columns layout immediately instead of one empty box.
  if (type === "grid") {
    const rows = Math.max(1, Number(node.props.rows) || 1);
    const columns = Math.max(1, Number(node.props.columns) || 1);
    node.children = Array.from({ length: rows * columns }, () => createNode("gridCell"));
  }
  // A fresh Countdown should point at a real future moment, not a frozen placeholder
  // date baked into the registry — default to 30 days out.
  if (type === "countdown") {
    const target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    node.props.targetDate = target.toISOString().slice(0, 16);
  }
  return node;
}

function buildHeaderZones(): PageNode[] {
  const start = createNode("navZone");
  start.children = [createNode("logo")];

  const middle = createNode("navZone");
  middle.children = [createNode("navLinks")];

  const end = createNode("navZone");

  return assignZonePositions([start, middle, end]);
}

/** Zone 0 hugs the start, the last zone hugs the end, everything between shares and
 * centers the remaining space — this holds for any zone count, not just 3. */
function assignZonePositions(zones: PageNode[]): PageNode[] {
  const last = zones.length - 1;
  return zones.map((zone, i) => ({
    ...zone,
    props: { ...zone.props, zone: i === 0 ? "start" : i === last ? "end" : "middle" },
  }));
}

/**
 * Upgrades a legacy Header (saved before zones existed, so it has no children) to the
 * zone-based layout. No-op if it already has zones — never overwrites existing content.
 */
export function ensureHeaderZones(node: PageNode): PageNode {
  if (node.type !== "header" || node.children.length > 0) return node;
  return { ...node, children: buildHeaderZones() };
}

/**
 * Updates a Header's zone count, growing its children (one "navZone" per zone) as
 * needed and recomputing each zone's start/middle/end position. Never removes existing
 * zones on shrink — a "hidden" zone still holds content the user may not want deleted —
 * so the visible zone count can temporarily exceed `count` until the user removes one.
 */
export function setHeaderZoneCount(node: PageNode, count: number): PageNode {
  const clamped = Math.max(1, Math.min(6, count));
  const children = [...node.children];
  while (children.length < clamped) children.push(createNode("navZone"));
  return { ...node, props: { ...node.props, zoneCount: clamped }, children: assignZonePositions(children) };
}

/**
 * Updates a Container's column count, growing its children (one "column" node per
 * column) as needed. Never removes existing columns on shrink — even an emptied
 * column may hold content the user doesn't want silently deleted — so the visible
 * column count can temporarily exceed `count` until the user deletes one manually.
 */
export function setContainerColumnCount(node: PageNode, count: number): PageNode {
  const clamped = Math.max(1, Math.min(4, count));
  const children = [...node.children];
  while (children.length < clamped) children.push(createNode("column"));
  return { ...node, props: { ...node.props, columns: clamped }, children };
}

/**
 * Updates a Grid's row/column counts, growing its cells (one "gridCell" node per
 * row×column slot) as needed. A cell spanning multiple tracks (style.gridColumnSpan/
 * gridRowSpan) visually consumes more of the grid than one slot — the browser reflows
 * later cells to fit, same as any CSS Grid auto-placement — so the *slot* count here is
 * a floor, not a guarantee of exactly rows×columns visible cells. Like
 * setContainerColumnCount, shrinking never deletes existing cells or their content.
 */
export function setGridDimensions(node: PageNode, rows: number, columns: number): PageNode {
  const clampedRows = Math.max(1, Math.min(12, rows));
  const clampedColumns = Math.max(1, Math.min(12, columns));
  const total = clampedRows * clampedColumns;
  const children = [...node.children];
  while (children.length < total) children.push(createNode("gridCell"));
  return { ...node, props: { ...node.props, rows: clampedRows, columns: clampedColumns }, children };
}

/**
 * Sets one column or row track's explicit size on a Grid. Unlike Container (where each
 * Column owns its own width via style.columnWidth), a Grid's tracks are a property of
 * the Grid itself — every cell in the same column/row shares that one track size, same
 * as a spreadsheet column/row — so this lives on the Grid, not the cell.
 *
 * Only correctly targets cells that don't span multiple tracks: a spanning cell shifts
 * later cells' effective row/column via the browser's own grid auto-placement, which
 * this doesn't attempt to replicate. Combining custom track sizes with spanning cells
 * on the same grid is a rare-enough combination that this approximation is an
 * acceptable trade-off over the complexity of a full auto-placement simulation.
 */
export function setGridTrackSize(
  node: PageNode,
  axis: "column" | "row",
  index: number,
  size: string
): PageNode {
  const count = Math.max(1, Number(node.props[axis === "column" ? "columns" : "rows"]) || 1);
  const key = axis === "column" ? "columnTracks" : "rowTracks";
  const defaultTrack = axis === "column" ? "minmax(0, 1fr)" : "minmax(80px, auto)";
  const existing = Array.isArray(node.props[key]) ? [...(node.props[key] as string[])] : [];
  while (existing.length < count) existing.push(defaultTrack);
  const clampedIndex = Math.max(0, Math.min(count - 1, index));
  existing[clampedIndex] = size;
  return { ...node, props: { ...node.props, [key]: existing.slice(0, count) } };
}

export function createEmptyPage(): PageNode {
  return {
    id: "root",
    type: "root",
    props: {},
    style: {},
    children: [],
  };
}

export function findNode(root: PageNode, id: string): PageNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: PageNode, childId: string): { parent: PageNode; index: number } | null {
  for (let i = 0; i < root.children.length; i++) {
    if (root.children[i].id === childId) return { parent: root, index: i };
    const found = findParent(root.children[i], childId);
    if (found) return found;
  }
  return null;
}

/**
 * Returns the chain of nodes from (but not including) the root down to `id`, inclusive
 * of `id` itself. Used to let the Inspector offer "select parent" breadcrumbs — once a
 * container/column is filled with content that content covers its entire clickable
 * area, so clicking never bubbles up far enough to reselect the container itself.
 */
export function findAncestorChain(root: PageNode, id: string): PageNode[] {
  function walk(current: PageNode, path: PageNode[]): PageNode[] | null {
    if (current.id === id) return [...path, current];
    for (const child of current.children) {
      const found = walk(child, [...path, current]);
      if (found) return found;
    }
    return null;
  }
  const result = walk(root, []);
  if (!result) return [];
  // Drop the synthetic page root — it isn't a selectable/editable node.
  return result[0]?.type === "root" ? result.slice(1) : result;
}

/** Returns a new tree with `node` inserted as a child of `parentId` at `index`. */
export function insertNode(root: PageNode, parentId: string, node: PageNode, index?: number): PageNode {
  function recur(current: PageNode): PageNode {
    if (current.id === parentId) {
      const children = [...current.children];
      const at = index === undefined ? children.length : Math.max(0, Math.min(index, children.length));
      children.splice(at, 0, node);
      return { ...current, children };
    }
    return { ...current, children: current.children.map(recur) };
  }
  return recur(root);
}

/** Returns a new tree with the node matching `id` removed. */
export function removeNode(root: PageNode, id: string): PageNode {
  function recur(current: PageNode): PageNode {
    return {
      ...current,
      children: current.children.filter((c) => c.id !== id).map(recur),
    };
  }
  return recur(root);
}

/** Returns a new tree with the node matching `id` updated via `updater`. */
export function updateNode(root: PageNode, id: string, updater: (node: PageNode) => PageNode): PageNode {
  function recur(current: PageNode): PageNode {
    if (current.id === id) return updater(current);
    return { ...current, children: current.children.map(recur) };
  }
  return recur(root);
}

/** Moves an existing node (by id) to be a child of `newParentId` at `index`. */
export function moveNode(root: PageNode, nodeId: string, newParentId: string, index?: number): PageNode {
  const node = findNode(root, nodeId);
  if (!node) return root;
  const withoutNode = removeNode(root, nodeId);
  return insertNode(withoutNode, newParentId, node, index);
}

export function duplicateNode(root: PageNode, id: string): PageNode {
  const node = findNode(root, id);
  const parentInfo = findParent(root, id);
  if (!node || !parentInfo) return root;
  const clone = cloneWithNewIds(node);
  return insertNode(root, parentInfo.parent.id, clone, parentInfo.index + 1);
}

/** True if `id` refers to `node` itself or any node within its subtree. */
export function isNodeOrDescendant(node: PageNode, id: string): boolean {
  if (node.id === id) return true;
  return node.children.some((c) => isNodeOrDescendant(c, id));
}

/** True if any node in the subtree (including `node` itself) has the given type.
 * Used to decide whether a global section actually replaces per-page chrome: a global
 * "header" tree that contains a real Header component supersedes page-level headers,
 * while one that's only decoration (a utility bar, an announcement strip) does not. */
export function treeContainsType(node: PageNode, type: string): boolean {
  if (node.type === type) return true;
  return node.children.some((c) => treeContainsType(c, type));
}

/** Deep-copy a subtree with fresh ids throughout — used by duplicate, and by
 * inserting a Saved Block (each insertion must be an independent copy, not share ids
 * with the stored template or with other insertions). */
export function cloneWithNewIds(node: PageNode): PageNode {
  return {
    ...node,
    id: nanoid(10),
    props: structuredClone(node.props),
    style: structuredClone(node.style),
    children: node.children.map(cloneWithNewIds),
  };
}

const HTML_TAG_RE = /<[^>]*>/g;

/** Pulls every string value out of one props object (recursing into nested arrays/
 * objects — card lists, testimonial arrays, etc.) with HTML tags stripped, so rich text
 * fields contribute their visible words rather than markup. */
function extractPropStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    const text = value.replace(HTML_TAG_RE, " ").trim();
    if (text) out.push(text);
  } else if (Array.isArray(value)) {
    for (const item of value) extractPropStrings(item, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) extractPropStrings(v, out);
  }
}

/** Flattens a page/collection-item tree into one plain-text blob for full-text search —
 * every string prop value (headings, body copy, button labels, card/testimonial/FAQ
 * entries...) across every node, HTML-stripped and whitespace-joined. Generic over
 * component type by design: new block types need no changes here since it just walks
 * whatever props they declare, the same tree-walking style as treeContainsType. */
export function extractSearchText(node: PageNode): string {
  const out: string[] = [];
  function walk(current: PageNode) {
    extractPropStrings(current.props, out);
    current.children.forEach(walk);
  }
  walk(node);
  return out.join(" ").slice(0, 20000);
}
