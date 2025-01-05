import { Plugin, MarkdownView, Editor } from "obsidian";

export default class VariableManagerPlugin extends Plugin {

	async onload() {
		// Watch for active file changes
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.setupFileListener();
			})
		);

		// Setup listener for the initially active file
		this.setupFileListener();
	}

	private setupFileListener() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) return;

		const editor = activeView.editor;
		// this.removeVariableBlocks(editor);

		// Add debounce timer variable
		let debounceTimer: NodeJS.Timeout;

		// Process initial content
		this.processVariablesInEditor(editor);

		// Monitor editor changes
		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					const blocks = document.querySelectorAll(".variable-block");

					// Handle preview mode state changes
					const cursor = editor.getCursor();
					const line = editor.getLine(cursor.line);
					const match = line.match(/\{\{(\w+)\}\}/);

					blocks.forEach((block) => {
						if (match && block.textContent === `{{${match[1]}}}`) {
							block.classList.remove("preview");
							block.classList.add("editing");
						} else {
							block.classList.remove("editing");
							block.classList.add("preview");
						}
					});

					this.processVariablesInEditor(editor);
				}, 1000);
			})
		);
	}

	private processVariablesInEditor(editor: Editor) {
		const content = editor.getValue();
		const variableMap = this.getVariableMap(content);

		// Update existing blocks
		const blocks = document.querySelectorAll(".variable-block");
		blocks.forEach((block) => {
			const varName = block.getAttribute("data-variable");
			if (varName && variableMap[varName] !== undefined) {
				block.setAttribute("data-value", variableMap[varName].toString());
				block.classList.add("preview");
			}
		});


		const referencePattern = /\{\{(\w+)\}\}/g;
		let lastIndex = 0;
		let newContent = '';
		let match;

		while ((match = referencePattern.exec(content)) !== null) {
			// Add text before the match
			newContent += content.slice(lastIndex, match.index);

			const [fullMatch, varName] = match;

			// Check if this variable reference is already wrapped in a span
			const beforeMatch = content.slice(Math.max(0, match.index - 100), match.index);
			const afterMatch = content.slice(match.index + fullMatch.length, match.index + fullMatch.length + 7);
			const isAlreadyWrapped =
				(
					beforeMatch.includes('class="variable-block') ||
					beforeMatch.includes('data-variable') ||
					beforeMatch.includes('data-value')) &&
				afterMatch == '</span>';

			const spanStartTag = `<span class="variable-block preview" data-variable="${varName}" data-value="${variableMap[varName]}">`;
			if (isAlreadyWrapped) {
				// Remove the existing span wrapping and add a new one.
				// Find the start of the span tag before this variable
				const spanStart = content.lastIndexOf('<span', match.index);
				// Adjust newContent to remove the old span start tag.
				newContent = newContent.slice(0, newContent.length - (match.index - spanStart));
				// Add new span with updated values (no closing span tag since it's already there).
				newContent += `${spanStartTag}${fullMatch}`;
			} else {
				// If not wrapped, add the span.
				newContent += `${spanStartTag}${fullMatch}</span>`;
			}

			lastIndex = match.index + fullMatch.length;
		}

		// Add remaining text
		newContent += content.slice(lastIndex);

		if (content !== newContent) {
			console.log("Setting new content with variable blocks");
			editor.setValue(newContent);
		}
	}

	private evaluateExpression(expression: string, variables: Record<string, any>): any {
		try {
			// If it's a simple number (including decimals), return it directly
			const trimmedExpr = expression.trim();
			if (/^-?\d*\.?\d+$/.test(trimmedExpr)) {
				return parseFloat(trimmedExpr);
			}

			// Create variable declarations
			const varDeclarations = Object.entries(variables)
				.map(([key, value]) => `const ${key} = ${value};`)
				.join('\n');

			// Create and execute a function with the variables in scope
			const fn = new Function(`
				"use strict";
				${varDeclarations}
				return (${expression});
			`);

			const result = fn();
			return result;
		} catch (error) {
			console.error(`Error evaluating expression "${expression}":`, error);
			throw error;
		}
	}

	private getVariableMap(content: string): Record<string, any> {
		const variableMap: Record<string, any> = {};
		const variablePattern = /%%(\w+)=([\w\s\+\-\*\/\(\)\.\d]+)%%/g;
		const matches = Array.from(content.matchAll(variablePattern));

		// Process variables in order of appearance
		for (const match of matches) {
			const [_, varName, expression] = match;
			try {
				const value = this.evaluateExpression(expression, variableMap);
				variableMap[varName] = value;
			} catch (error) {
				console.error(`Error evaluating ${varName}: ${error}`);
				variableMap[varName] = expression; // Store original expression if evaluation fails
			}
		}

		return variableMap;
	}

	onunload() {
	}
}
