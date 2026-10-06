"use client";

import type { AppLanguage } from "@/i18n/config";
import { translateUiText } from "@/i18n/translate-ui-text";
import { useLayoutEffect, useRef } from "react";

const TRANSLATED_ATTRIBUTES = ["aria-label", "placeholder", "title"] as const;
const SKIPPED_PARENTS = new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);

const preserveOuterWhitespace = (source: string, translated: string) => {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
};

type AttributeValues = Map<string, string>;

export const DomTranslationBridge = ({
  language,
}: {
  language: AppLanguage;
}) => {
  const originalText = useRef(new WeakMap<Text, string>());
  const expectedText = useRef(new WeakMap<Text, string>());
  const originalAttributes = useRef(new WeakMap<Element, AttributeValues>());
  const expectedAttributes = useRef(new WeakMap<Element, AttributeValues>());

  useLayoutEffect(() => {
    const state = { applyingTranslations: false };

    const translateTextNode = (node: Text) => {
      if (SKIPPED_PARENTS.has(node.parentElement?.tagName ?? "")) return;

      const expected = expectedText.current.get(node);
      if (!originalText.current.has(node) || node.data !== expected) {
        originalText.current.set(node, node.data);
      }

      const source = originalText.current.get(node) ?? node.data;
      const translated = preserveOuterWhitespace(
        source,
        translateUiText(source, language),
      );
      expectedText.current.set(node, translated);
      if (node.data !== translated) node.data = translated;
    };

    const translateAttribute = (element: Element, attribute: string) => {
      const current = element.getAttribute(attribute);
      if (current === null) return;

      const originals =
        originalAttributes.current.get(element) ?? new Map<string, string>();
      if (!originalAttributes.current.has(element)) {
        originalAttributes.current.set(element, originals);
      }
      const expected =
        expectedAttributes.current.get(element) ?? new Map<string, string>();
      if (!expectedAttributes.current.has(element)) {
        expectedAttributes.current.set(element, expected);
      }

      if (!originals.has(attribute) || current !== expected.get(attribute)) {
        originals.set(attribute, current);
      }

      const translated = translateUiText(
        originals.get(attribute) ?? current,
        language,
      );
      expected.set(attribute, translated);
      if (current !== translated) element.setAttribute(attribute, translated);
    };

    const translateElement = (element: Element) => {
      for (const attribute of TRANSLATED_ATTRIBUTES) {
        translateAttribute(element, attribute);
      }
      if (
        element instanceof HTMLInputElement &&
        ["button", "reset", "submit"].includes(element.type)
      ) {
        translateAttribute(element, "value");
      }
    };

    const translateSubtree = (root: Node) => {
      state.applyingTranslations = true;
      if (root instanceof Text) translateTextNode(root);
      if (root instanceof Element) translateElement(root);

      root.childNodes.forEach(translateSubtree);
      state.applyingTranslations = false;
    };

    translateSubtree(document.body);

    const observer = new MutationObserver((mutations) => {
      if (state.applyingTranslations) return;
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateSubtree(mutation.target);
          continue;
        }
        if (mutation.type === "attributes") {
          translateSubtree(mutation.target);
          continue;
        }
        for (const node of mutation.addedNodes) translateSubtree(node);
      }
    });

    observer.observe(document.body, {
      attributeFilter: [...TRANSLATED_ATTRIBUTES, "value"],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
};
