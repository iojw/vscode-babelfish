import {
  Disposable,
  ExtensionContext,
  languages,
  commands,
  workspace,
  window,
} from "vscode";
import { CodelensProvider } from "./codeLensProvider";

let disposables: Disposable[] = [];

export function activate(context: ExtensionContext) {
  const codelensProvider = new CodelensProvider();

  languages.registerCodeLensProvider("*", codelensProvider);

  commands.registerCommand("vs-babelfish.enableCodeLens", () => {
    workspace
      .getConfiguration("vs-babelfish")
      .update("enableCodeLens", true, true);
  });

  commands.registerCommand("vs-babelfish.disableCodeLens", () => {
    workspace
      .getConfiguration("vs-babelfish")
      .update("enableCodeLens", false, true);
  });

  commands.registerCommand("vs-babelfish.codelensAction", (...args: any) => {
    window.showInformationMessage(
      `Translated from ${args[0]} to ${args[1]}: ${args[2]}`
    );
  });
}

export function deactivate() {
  if (disposables) {
    disposables.forEach((item) => item.dispose());
  }
  disposables = [];
}
