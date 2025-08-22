import * as vscode from "vscode";

type TSnippet = {
  id: string;
  title: string;
  code: string;
  language: string;
  createdAt: string;
};

export function activate(context: vscode.ExtensionContext) {
  console.log("✅ CodePocket extension activated");
  const saveSnippet = vscode.commands.registerCommand(
    "codepocket.saveSnippet",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No Active Editor!");
        return;
      }
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText.trim()) {
        vscode.window.showErrorMessage("No Code Selected!");
      }

      const snippetTitle = await vscode.window.showInputBox({
        prompt: "Enter a title for this snippet!",
        value: selectedText.split("\n")[0].slice(0, 30),
      });

      if (!snippetTitle) {
        vscode.window.showErrorMessage("Title not given!");
      }

      const snippet: TSnippet = {
        id: Date.now().toString(),
        title: snippetTitle ?? "",
        code: selectedText,
        language: editor.document.languageId,
        createdAt: new Date().toISOString(),
      };

      const snippets = context.globalState.get<TSnippet[]>("snippets") || [];
      snippets.push(snippet);
      await context.globalState.update("snippets", snippets);

      vscode.window.showInformationMessage(
        `Snippet "${snippetTitle}" saved to CodePocket!`
      );
    }
  );
  context.subscriptions.push(saveSnippet);

  const viewSnippets = vscode.commands.registerCommand(
  "codepocket.viewSnippets",
  async () => {
    const snippets = context.globalState.get<TSnippet[]>("snippets") || [];

    if (snippets.length === 0) {
      vscode.window.showInformationMessage("No snippets saved yet!");
      return;
    }

    const picked = await vscode.window.showQuickPick(
      snippets.map((s) => ({
        label: s.title,
        description: `${s.language} • ${new Date(s.createdAt).toLocaleString()}`,
        snippet: s,
      })),
      { placeHolder: "Select a snippet to view" }
    );

    if (picked) {
      const action = await vscode.window.showQuickPick(
        ["Copy to Clipboard", "Insert into Editor"],
        { placeHolder: "What do you want to do?" }
      );

      if (action === "Copy to Clipboard") {
        vscode.env.clipboard.writeText(picked.snippet.code);
        vscode.window.showInformationMessage(
          `Snippet "${picked.label}" copied to clipboard!`
        );
      } else if (action === "Insert into Editor") {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, picked.snippet.code);
          });
        }
      }
    }
  }
);

context.subscriptions.push(viewSnippets);

}

export function deactivate() {}
