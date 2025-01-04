import { Plugin, MarkdownView } from "obsidian";

export default class VariableManagerPlugin extends Plugin {
	async onload() {
		console.log("Variable Manager Plugin Loaded");

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
		// Get the active editor
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) return;

		const editor = activeView.editor;

		// Define a listener for editor changes
		const callback = () => {
			const content = editor.getValue();
			const updatedContent = this.processVariables(content);

			// Update the editor content only if there are changes
			if (content !== updatedContent) {
				const cursor = editor.getCursor(); // Save cursor position
				editor.setValue(updatedContent); // Update content
				editor.setCursor(cursor); // Restore cursor position
			}
		};

		// Register the editor change listener
		this.registerEvent(
			this.app.workspace.on("editor-change", callback)
		);
	}

	processVariables(content: string): string {
		const variableMap: Record<string, any> = {};
		const variablePattern = /%%(\w+)=([\w\s\+\-\*\/\(\)]+)%%/g;

		// Extract variables
		let match;
		while ((match = variablePattern.exec(content)) !== null) {
			const [fullMatch, varName, expression] = match;
			try {
				// Evaluate expression
				const value = this.evaluateExpression(expression, variableMap);
				variableMap[varName] = value;
			} catch (error) {
				console.error(`Error evaluating ${varName}: ${error}`);
			}
		}

		// Replace references to variables
		const referencePattern = /\{\{(\w+)\}\}/g;
		content = content.replace(referencePattern, (_, varName) => {
			return variableMap[varName] !== undefined
				? variableMap[varName]
				: `{{${varName}}}`;
		});

		return content;
	}

	evaluateExpression(expression: string, variables: Record<string, any>): any {
		const sanitizedExpression = expression.replace(
			/\b(\w+)\b/g,
			(word) => (variables[word] !== undefined ? variables[word] : word)
		);
		return Function(`"use strict"; return (${sanitizedExpression})`)();
	}

	onunload() {
		console.log("Variable Manager Plugin Unloaded");
	}
}
