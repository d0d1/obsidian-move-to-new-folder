import { App, Modal } from "obsidian";

export class ConfirmationModal extends Modal {
  private readonly titleText: string;
  private readonly bodyText: string;
  private readonly confirmText: string;
  private readonly onCloseResolve: (confirmed: boolean) => void;
  private didResolve = false;

  constructor(
    app: App,
    titleText: string,
    bodyText: string,
    confirmText: string,
    onCloseResolve: (confirmed: boolean) => void,
  ) {
    super(app);
    this.titleText = titleText;
    this.bodyText = bodyText;
    this.confirmText = confirmText;
    this.onCloseResolve = onCloseResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle(this.titleText);
    contentEl.createEl("p", { text: this.bodyText });

    const actionsEl = contentEl.createDiv({ cls: "move-to-new-folder-actions" });

    const cancelButton = actionsEl.createEl("button", {
      text: "Cancel",
      cls: "mod-muted",
    });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => this.closeWithResult(false));

    const confirmButton = actionsEl.createEl("button", {
      text: this.confirmText,
      cls: "mod-cta",
    });
    confirmButton.type = "button";
    confirmButton.addEventListener("click", () => this.closeWithResult(true));
  }

  onClose(): void {
    if (!this.didResolve) {
      this.onCloseResolve(false);
    }
    this.contentEl.empty();
  }

  private closeWithResult(confirmed: boolean): void {
    this.didResolve = true;
    this.onCloseResolve(confirmed);
    this.close();
  }
}
