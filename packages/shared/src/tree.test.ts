import { describe, it, expect } from "vitest";
import {
  createNode,
  createEmptyPage,
  insertNode,
  removeNode,
  moveNode,
  duplicateNode,
  findNode,
  findParent,
  cloneWithNewIds,
} from "./tree.js";

describe("tree helpers", () => {
  it("creates an empty root page", () => {
    const page = createEmptyPage();
    expect(page.type).toBe("root");
    expect(page.children).toEqual([]);
  });

  it("inserts and finds a node", () => {
    const page = createEmptyPage();
    const hero = createNode("hero");
    const next = insertNode(page, page.id, hero, 0);
    expect(findNode(next, hero.id)?.type).toBe("hero");
  });

  it("removes a node", () => {
    const page = createEmptyPage();
    const hero = createNode("hero");
    const withHero = insertNode(page, page.id, hero, 0);
    const without = removeNode(withHero, hero.id);
    expect(findNode(without, hero.id)).toBeNull();
  });

  it("moves a node between parents", () => {
    const page = createEmptyPage();
    const container = createNode("container");
    const col = container.children[0];
    const hero = createNode("hero");
    const cta = createNode("cta");
    let tree = insertNode(page, page.id, container, 0);
    tree = insertNode(tree, page.id, hero, 0);
    tree = insertNode(tree, col.id, cta, 0);
    tree = moveNode(tree, hero.id, col.id, 0);
    expect(findParent(tree, hero.id)?.parent.id).toBe(col.id);
  });

  it("duplicates a subtree with fresh ids", () => {
    const page = createEmptyPage();
    const hero = createNode("hero");
    const tree = insertNode(page, page.id, hero, 0);
    const duped = duplicateNode(tree, hero.id);
    const allHeroes = duped.children.filter((c) => c.type === "hero");
    expect(allHeroes.length).toBe(2);
    expect(allHeroes[0].id).not.toBe(allHeroes[1].id);
  });

  it("cloneWithNewIds produces independent copies", () => {
    const hero = createNode("hero");
    const copy = cloneWithNewIds(hero);
    expect(copy.id).not.toBe(hero.id);
    expect(copy.type).toBe("hero");
  });
});
