import * as vscode from "vscode";
import { translateString } from "./utils";

class BabelFishCodeLens extends vscode.CodeLens {
  public text: string;

  constructor(range: vscode.Range, text: string) {
    super(range);
    this.text = text;
  }
}

export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private regex: RegExp;
  private _onDidChangeCodeLenses: vscode.EventEmitter<
    void
  > = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this
    ._onDidChangeCodeLenses.event;

  constructor() {
    // TODO: Tabs?
    this.regex = /\/\*\*\s*([\S\n\r ]+?)\s*\*\//gm;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (
      !vscode.workspace
        .getConfiguration("vs-babelfish")
        .get("enableCodeLens", true)
    )
      return [];

    this.codeLenses = [];
    const regex = new RegExp(this.regex);
    const text = document.getText();
    let matches;
    while ((matches = regex.exec(text)) !== null) {
      const lines = matches[1]
        .replace(/\*/g, "")
        .split(/\n/g)
        .map((a) => a.trim());
      const firstLine = document.lineAt(
        document.positionAt(text.indexOf(matches[1])).line
      );

      for (const [i, line] of lines.entries()) {
        if (line === "") continue;

        const lineNumber = firstLine.lineNumber + i;
        const index = document.lineAt(lineNumber).text.indexOf(line);
        const position = new vscode.Position(lineNumber, index);
        const range = document.getWordRangeAtPosition(position);
        if (range) {
          this.codeLenses.push(new BabelFishCodeLens(range, line));
        }
      }
    }
    return this.codeLenses;
  }

  public async resolveCodeLens(
    codeLens: BabelFishCodeLens,
    token: vscode.CancellationToken
  ) {
    if (
      !vscode.workspace
        .getConfiguration("vs-babelfish")
        .get("enableCodeLens", true)
    )
      return null;

    const language = vscode.workspace
      .getConfiguration("vs-babelfish")
      .get("language", "en");
    const result = await translateString(codeLens.text, language);

    if (!result || result.detectedLanguage.language === language) return null;

    codeLens.command = {
      title: result.translations[0].text,
      tooltip: "View all information",
      command: "vs-babelfish.codelensAction",
      arguments: [
        result.detectedLanguage.language,
        result.translations[0].to,
        result.translations[0].text,
      ],
    };
    return codeLens;
  }
}
