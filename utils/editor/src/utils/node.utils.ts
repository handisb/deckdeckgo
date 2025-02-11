export const cleanNode = ({node}: {node: Node}): Node | null => {
  if (isTextNode(node)) {
    return node;
  }

  if (isElementNode(node)) {
    const clone: HTMLElement = node.cloneNode(true) as HTMLElement;
    clone.removeAttribute('contenteditable');
    clone.removeAttribute('editable');
    clone.removeAttribute('spellcheck');
    clone.removeAttribute('highlighted');
    clone.removeAttribute('custom-loader');
    clone.removeAttribute('class');

    return clone;
  }

  return null;
};

export const isTextNode = (element: Node | undefined): boolean => {
  return element?.nodeType === Node.TEXT_NODE || element?.nodeType === Node.COMMENT_NODE;
};

export const isElementNode = (element: Node | undefined): boolean => {
  return element?.nodeType === Node.ELEMENT_NODE;
};

export const nodeIndex = (element: HTMLElement): number => {
  return Array.from(element.parentNode?.children || []).indexOf(element);
};
