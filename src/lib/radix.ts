let nodeIdCounter = 0;

export class RadixNode {
  id: string;
  edges: Map<string, RadixEdge>;
  isEndOfWord: boolean;
  definition?: string;

  constructor() {
    this.id = `node_${nodeIdCounter++}`;
    this.edges = new Map();
    this.isEndOfWord = false;
  }
}

export class RadixEdge {
  label: string;
  target: RadixNode;

  constructor(label: string, target: RadixNode) {
    this.label = label;
    this.target = target;
  }
}

export class RadixTrie {
  root: RadixNode;

  constructor() {
    this.root = new RadixNode();
  }

  insert(word: string, definition: string): { path: string[] } {
    const path: string[] = [this.root.id];
    this._insert(this.root, word.toLowerCase(), definition, path);
    return { path };
  }

  private _insert(node: RadixNode, word: string, definition: string, path: string[]) {
    if (word.length === 0) {
      node.isEndOfWord = true;
      node.definition = definition;
      return;
    }

    const firstChar = word[0];
    const edge = node.edges.get(firstChar);

    if (!edge) {
      const newNode = new RadixNode();
      node.edges.set(firstChar, new RadixEdge(word, newNode));
      newNode.isEndOfWord = true;
      newNode.definition = definition;
      path.push(newNode.id);
      return;
    }

    const commonPrefixLen = this.getCommonPrefixLength(edge.label, word);

    if (commonPrefixLen === edge.label.length) {
      path.push(edge.target.id);
      this._insert(edge.target, word.slice(commonPrefixLen), definition, path);
    } else {
      // Split the edge
      const splitNode = new RadixNode();
      path.push(splitNode.id);
      
      const oldTarget = edge.target;
      const oldLabelRemaining = edge.label.slice(commonPrefixLen);
      
      splitNode.edges.set(oldLabelRemaining[0], new RadixEdge(oldLabelRemaining, oldTarget));
      
      edge.label = edge.label.slice(0, commonPrefixLen);
      edge.target = splitNode;

      const wordRemaining = word.slice(commonPrefixLen);
      if (wordRemaining.length > 0) {
        const newNode = new RadixNode();
        splitNode.edges.set(wordRemaining[0], new RadixEdge(wordRemaining, newNode));
        newNode.isEndOfWord = true;
        newNode.definition = definition;
        path.push(newNode.id);
      } else {
        splitNode.isEndOfWord = true;
        splitNode.definition = definition;
      }
    }
  }

  private getCommonPrefixLength(s1: string, s2: string): number {
    let i = 0;
    while (i < s1.length && i < s2.length && s1[i] === s2[i]) {
      i++;
    }
    return i;
  }

  delete(word: string): { success: boolean, path: string[] } {
    const path: string[] = [this.root.id];
    const success = this._delete(this.root, word.toLowerCase(), path);
    return { success, path };
  }

  private _delete(node: RadixNode, word: string, path: string[]): boolean {
    if (word.length === 0) {
      if (!node.isEndOfWord) return false;
      node.isEndOfWord = false;
      node.definition = undefined;
      return true;
    }

    const firstChar = word[0];
    const edge = node.edges.get(firstChar);

    if (!edge) return false;

    if (word.startsWith(edge.label)) {
      path.push(edge.target.id);
      const deleted = this._delete(edge.target, word.slice(edge.label.length), path);
      if (deleted) {
        // Cleanup / Compress
        if (edge.target.edges.size === 0 && !edge.target.isEndOfWord) {
          node.edges.delete(firstChar);
        } else if (edge.target.edges.size === 1 && !edge.target.isEndOfWord) {
          const onlyChildEdge = Array.from(edge.target.edges.values())[0];
          edge.label += onlyChildEdge.label;
          edge.target = onlyChildEdge.target;
        }
      }
      return deleted;
    }

    return false;
  }

  search(word: string): { found: boolean, definition?: string, path: string[], node?: RadixNode } {
    const path: string[] = [this.root.id];
    let curr = this.root;
    let remaining = word.toLowerCase();

    while (remaining.length > 0) {
      const edge = curr.edges.get(remaining[0]);
      if (!edge) {
        return { found: false, path, node: curr };
      }

      if (remaining.startsWith(edge.label)) {
        path.push(edge.target.id);
        curr = edge.target;
        remaining = remaining.slice(edge.label.length);
      } else {
        path.push(edge.target.id);
        return { found: false, path, node: curr };
      }
    }

    if (curr.isEndOfWord) {
      return { found: true, definition: curr.definition, path, node: curr };
    } else {
      return { found: false, path, node: curr };
    }
  }

  getAllWords(node: RadixNode = this.root, prefix: string = ""): {word: string, definition: string}[] {
    let words: {word: string, definition: string}[] = [];
    if (node.isEndOfWord && node.definition) {
      words.push({ word: prefix, definition: node.definition });
    }
    
    const sortedEdges = Array.from(node.edges.values()).sort((a, b) => a.label.localeCompare(b.label));
    
    for (const edge of sortedEdges) {
      words = words.concat(this.getAllWords(edge.target, prefix + edge.label));
    }
    return words;
  }
  
  getSuggestions(word: string): string[] {
    let curr = this.root;
    let remaining = word.toLowerCase();
    let matchedPrefix = "";

    while (remaining.length > 0) {
      const edge = curr.edges.get(remaining[0]);
      if (!edge) break;

      const commonLen = this.getCommonPrefixLength(edge.label, remaining);
      if (commonLen === edge.label.length) {
        curr = edge.target;
        matchedPrefix += edge.label;
        remaining = remaining.slice(edge.label.length);
      } else if (commonLen === remaining.length) {
        curr = edge.target;
        matchedPrefix += edge.label;
        remaining = "";
        break;
      } else {
        curr = edge.target;
        matchedPrefix += edge.label;
        break;
      }
    }

    const suffixes = this.getAllWords(curr, "");
    return suffixes.map(s => matchedPrefix + s.word).filter(w => w !== word.toLowerCase()).slice(0, 5);
  }
}
