import { App, Modal, Notice, TFolder } from "obsidian";

import { validateFolderNameForCurrentPlatform, type FolderNameValidationResult } from "../validation/folderNameValidation";

export interface MoveToNewFolderModalResult {
  parentPath: string;
  folderName: string;
}

export class MoveToNewFolderModal extends Modal {
  private readonly onCloseResolve: (result: MoveToNewFolderModalResult | null) => void;
  private searchValue = "";
  private selectedIndex = 0;
  private selectedPath: string;
  private folderName = "";
  private readonly folderPaths: string[];
  private readonly listByPath: Map<string, HTMLButtonElement> = new Map();
  private didResolve = false;

  constructor(app: App, initialPath: string, onCloseResolve: (result: MoveToNewFolderModalResult | null) => void) {
    super(app);
    this.selectedPath = initialPath;
    this.onCloseResolve = onCloseResolve;
    this.folderPaths = this.collectFolderPaths();

    if (!this.folderPaths.includes(this.selectedPath)) {
      this.selectedPath = "";
    }

    const initialIndex = this.folderPaths.indexOf(this.selectedPath);
    this.selectedIndex = initialIndex >= 0 ? initialIndex : 0;
  }

  onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass("move-to-new-folder-modal");
    contentEl.empty();
    this.setTitle("Move file to new folder");

    const layoutEl = contentEl.createDiv({ cls: "move-to-new-folder-layout" });

    const parentSectionEl = layoutEl.createDiv({ cls: "move-to-new-folder-section" });
    parentSectionEl.createEl("label", {
      text: "Parent folder",
      cls: "move-to-new-folder-label",
    });

    const selectedParentEl = parentSectionEl.createDiv({
      cls: "move-to-new-folder-parent-path",
    });

    const searchInput = parentSectionEl.createEl("input", {
      type: "text",
      placeholder: "Filter folders...",
      cls: "move-to-new-folder-search",
    });
    const listEl = parentSectionEl.createDiv({ cls: "move-to-new-folder-list" });

    const nameSectionEl = layoutEl.createDiv({ cls: "move-to-new-folder-section" });

    const nameInput = nameSectionEl.createEl("input", {
      type: "text",
      placeholder: "New folder name",
      cls: "move-to-new-folder-text-input",
    });
    nameInput.value = this.folderName;
    const validationEl = nameSectionEl.createDiv({
      cls: "move-to-new-folder-validation",
    });

    const updateSelectedParent = (): void => {
      selectedParentEl.empty();
      selectedParentEl.createSpan({
        cls: "move-to-new-folder-parent-badge",
        text: this.selectedPath.length > 0 ? this.selectedPath : "/",
      });
    };

    const render = (): void => {
      listEl.empty();
      this.listByPath.clear();

      const filtered = this.getFilteredFolders();
      if (filtered.length === 0) {
        updateSelectedParent();
        listEl.createDiv({
          text: "No folders match your search.",
          cls: "move-to-new-folder-empty",
        });
        return;
      }

      if (this.selectedIndex >= filtered.length) {
        this.selectedIndex = 0;
      }

      const selectedPathIndex = filtered.indexOf(this.selectedPath);
      if (selectedPathIndex >= 0) {
        this.selectedIndex = selectedPathIndex;
      } else {
        this.selectedPath = filtered[this.selectedIndex];
      }

      updateSelectedParent();

      for (const folderPath of filtered) {
        const button = listEl.createEl("button", {
          cls: "move-to-new-folder-item",
        });
        button.type = "button";
        button.dataset.path = folderPath;

        const rowEl = button.createDiv({ cls: "move-to-new-folder-item-row" });
        rowEl.createSpan({
          cls: "move-to-new-folder-item-label",
          text: folderPath.length > 0 ? folderPath : "/",
        });

        if (folderPath === this.selectedPath) {
          button.addClass("is-selected");
        }

        button.addEventListener("click", () => {
          this.selectedPath = folderPath;
          render();
        });

        button.addEventListener("mouseenter", () => {
          button.addClass("is-hovered");
        });

        button.addEventListener("mouseleave", () => {
          button.removeClass("is-hovered");
        });

        this.listByPath.set(folderPath, button);
      }

      this.refreshSelection(listEl, filtered);
    };

    searchInput.addEventListener("input", () => {
      this.searchValue = searchInput.value.trim();
      const filtered = this.getFilteredFolders();
      if (!filtered.includes(this.selectedPath)) {
        this.selectedIndex = 0;
        if (filtered.length > 0) {
          this.selectedPath = filtered[0];
        }
      }
      render();
    });

    searchInput.addEventListener("keydown", (event) => {
      const filtered = this.getFilteredFolders();

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (filtered.length > 0) {
          this.selectedIndex = Math.min(this.selectedIndex + 1, filtered.length - 1);
          this.selectedPath = filtered[this.selectedIndex];
          this.refreshSelection(listEl, filtered);
        }
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (filtered.length > 0) {
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
          this.selectedPath = filtered[this.selectedIndex];
          this.refreshSelection(listEl, filtered);
        }
      }

      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    });

    const actionsEl = contentEl.createDiv({ cls: "move-to-new-folder-actions" });
    const cancelButton = actionsEl.createEl("button", {
      text: "Cancel",
      cls: "mod-muted",
    });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => this.closeWithResult(null));

    const moveButton = actionsEl.createEl("button", {
      text: "Move file",
      cls: "mod-cta",
    });
    moveButton.type = "button";

    const updateValidationState = (): FolderNameValidationResult => {
      const validation = validateFolderNameForCurrentPlatform(nameInput.value);
      validationEl.setText(validation.message);
      validationEl.toggleClass("is-invalid", !validation.isValid);
      validationEl.toggleClass("is-valid", validation.isValid);
      moveButton.disabled = !validation.isValid;
      return validation;
    };

    nameInput.addEventListener("input", () => {
      this.folderName = nameInput.value;
      updateValidationState();
    });

    const submit = (): void => {
      const value = nameInput.value.trim();
      const validation = validateFolderNameForCurrentPlatform(value);
      if (!validation.isValid) {
        new Notice(validation.message);
        nameInput.focus();
        return;
      }

      this.folderName = value;
      this.closeWithResult({
        parentPath: this.selectedPath,
        folderName: value,
      });
    };

    moveButton.addEventListener("click", submit);

    render();
    updateValidationState();
    nameInput.focus();
    nameInput.select();
  }

  onClose(): void {
    if (!this.didResolve) {
      this.onCloseResolve(null);
    }
    this.modalEl.removeClass("move-to-new-folder-modal");
    this.contentEl.empty();
  }

  private collectFolderPaths(): string[] {
    const folderSet = new Set<string>([""]);

    for (const item of this.app.vault.getAllLoadedFiles()) {
      if (item instanceof TFolder) {
        folderSet.add(item.path);
      }
    }

    return Array.from(folderSet).sort((a, b) => a.localeCompare(b));
  }

  private getFilteredFolders(): string[] {
    if (!this.searchValue) {
      return this.folderPaths;
    }

    const needle = this.searchValue.toLocaleLowerCase();
    return this.folderPaths.filter((path) => {
      const haystack = path.length > 0 ? path.toLocaleLowerCase() : "/";
      return haystack.includes(needle);
    });
  }

  private refreshSelection(listEl: HTMLElement, filtered: string[]): void {
    for (const [path, button] of this.listByPath.entries()) {
      const shouldSelect = path === this.selectedPath;
      button.toggleClass("is-selected", shouldSelect);
      if (shouldSelect) {
        button.scrollIntoView({ block: "nearest" });
      }
    }

    if (!filtered.includes(this.selectedPath) && filtered.length > 0) {
      this.selectedIndex = 0;
      this.selectedPath = filtered[0];
      this.refreshSelection(listEl, filtered);
    }
  }

  private closeWithResult(result: MoveToNewFolderModalResult | null): void {
    this.didResolve = true;
    this.onCloseResolve(result);
    this.close();
  }
}
