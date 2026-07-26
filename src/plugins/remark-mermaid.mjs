import { visit } from "unist-util-visit";

/**
 * Remark plugin that transforms ```mermaid code blocks into <div class="mermaid"> HTML nodes.
 * Must run BEFORE syntax highlighters (Expressive Code / Shiki) so they never see the mermaid blocks.
 */
export function remarkMermaid() {
	return (tree) => {
		visit(tree, "code", (node, index, parent) => {
			if (node.lang !== "mermaid") return;

			// Replace the code node with a raw HTML node
			parent.children.splice(index, 1, {
				type: "html",
				value: `<div class="mermaid">\n${node.value}\n</div>`,
			});
		});
	};
}
