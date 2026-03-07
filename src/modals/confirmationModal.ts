import { App, Modal } from "obsidian";

export type ConfirmationModalResult = "back" | "confirm" | "close";

export class ConfirmationModal extends Modal {
  private readonly titleText: string;
  private readonly bodyText: string;
  private readonly backText: string;
  private readonly confirmText: string;
  private readonly onCloseResolve: (result: ConfirmationModalResult) => void;
  private didResolve = false;

  constructor(
    app: App,
    titleText: string,
    bodyText: string,
    backText: string,
    confirmText: string,
    onCloseResolve: (result: ConfirmationModalResult) => void,
  ) {
    super(app);
    this.titleText = titleText;
    this.bodyText = bodyText;
    this.backText = backText;
    this.confirmText = confirmText;
    this.onCloseResolve = onCloseResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass("move-to-new-folder-confirmation-modal");
    contentEl.empty();
    this.setTitle(this.titleText);

    const bodyEl = contentEl.createDiv({ cls: "move-to-new-folder-confirmation-body" });
    bodyEl.createEl("p", {
      text: this.bodyText,
      cls: "move-to-new-folder-confirmation-text",
    });

    const actionsEl = contentEl.createDiv({ cls: "move-to-new-folder-actions" });

    const backButton = actionsEl.createEl("button", {
      text: this.backText,
      cls: "mod-muted",
    });
    backButton.type = "button";
    backButton.addEventListener("click", () => this.closeWithResult("back"));

    const confirmButton = actionsEl.createEl("button", {
      text: this.confirmText,
      cls: "mod-cta",
    });
    confirmButton.type = "button";
    confirmButton.addEventListener("click", () => this.closeWithResult("confirm"));
  }

  onClose(): void {
    if (!this.didResolve) {
      this.onCloseResolve("close");
    }
    this.modalEl.removeClass("move-to-new-folder-confirmation-modal");
    this.contentEl.empty();
  }

  private closeWithResult(result: ConfirmationModalResult): void {
    this.didResolve = true;
    this.onCloseResolve(result);
    this.close();
  }
}
