import { App, Modal, Notice, Platform } from "obsidian";

import { validateFolderNameForCurrentPlatform, type FolderNameValidationResult } from "../validation/folderNameValidation";

export interface MoveToNewFolderModalResult {
  parentPath: string;
  folderName: string;
}

export type MoveTargetKind = "file" | "folder";

export class MoveToNewFolderModal extends Modal {
  private readonly onCloseResolve: (result: MoveToNewFolderModalResult | null) => void;
  private readonly targetKind: MoveTargetKind;
  private searchValue = "";
  private selectedIndex = 0;
  private selectedPath: string;
  private folderName = "";
  private hasTriedSubmit = false;
  private hasEditedFolderName = false;
  private readonly folderPaths: string[];
  private readonly listByPath: Map<string, HTMLElement> = new Map();
  private didResolve = false;
  private hasRevealedInitialSelection = false;

  constructor(
    app: App,
    folderPaths: string[],
    initialPath: string,
    targetKind: MoveTargetKind,
    onCloseResolve: (result: MoveToNewFolderModalResult | null) => void,
  ) {
    super(app);
    this.selectedPath = initialPath;
    this.targetKind = targetKind;
    this.onCloseResolve = onCloseResolve;
    this.folderPaths = folderPaths;

    if (!this.folderPaths.includes(this.selectedPath)) {
      this.selectedPath = "";
    }

    const initialIndex = this.folderPaths.indexOf(this.selectedPath);
    this.selectedIndex = initialIndex >= 0 ? initialIndex : 0;
  }

  onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass("move-to-new-folder-modal");
    if (Platform.isMobile) {
      this.modalEl.addClass("move-to-new-folder-modal-mobile");
    }
    contentEl.empty();
    this.setTitle(
      this.targetKind === "folder"
        ? "Move folder to new folder"
        : "Move file to new folder",
    );

    const layoutEl = contentEl.createDiv({ cls: "move-to-new-folder-layout" });
    const idPrefix = `move-to-new-folder-${Date.now()}`;
    const nameInputId = `${idPrefix}-name-input`;
    const validationId = `${idPrefix}-name-validation`;
    const parentLabelId = `${idPrefix}-parent-label`;
    const searchLabelId = `${idPrefix}-filter-label`;
    const searchInputId = `${idPrefix}-filter-input`;
    const listboxId = `${idPrefix}-listbox`;

    const nameSectionEl = layoutEl.createDiv({
      cls: "move-to-new-folder-section move-to-new-folder-section-name",
    });

    const nameLabelEl = nameSectionEl.createEl("label", {
      text: "New folder name",
      cls: "move-to-new-folder-label",
    });
    nameLabelEl.htmlFor = nameInputId;

    const nameInput = nameSectionEl.createEl("input", {
      type: "text",
      placeholder: "New folder name",
      cls: "move-to-new-folder-text-input",
    });
    nameInput.id = nameInputId;
    nameInput.value = this.folderName;
    nameInput.enterKeyHint = "done";
    nameInput.setAttr("aria-describedby", validationId);
    const validationEl = nameSectionEl.createDiv({
      cls: "move-to-new-folder-validation",
    });
    validationEl.id = validationId;
    validationEl.setAttr("role", "alert");

    const parentSectionEl = layoutEl.createDiv({
      cls: "move-to-new-folder-section move-to-new-folder-section-parent",
    });
    const parentLabelEl = parentSectionEl.createEl("label", {
      text: "Destination parent folder",
      cls: "move-to-new-folder-label",
    });
    parentLabelEl.id = parentLabelId;

    const searchLabelEl = parentSectionEl.createEl("label", {
      text: "Filter folders",
      cls: "move-to-new-folder-sr-only",
    });
    searchLabelEl.id = searchLabelId;
    searchLabelEl.htmlFor = searchInputId;

    const searchInput = parentSectionEl.createEl("input", {
      type: "text",
      placeholder: "Filter folders...",
      cls: "move-to-new-folder-search",
    });
    searchInput.id = searchInputId;
    if (Platform.isMobile) {
      searchInput.tabIndex = -1;
    }
    const listEl = parentSectionEl.createDiv({ cls: "move-to-new-folder-list" });
    listEl.id = listboxId;
    listEl.tabIndex = 0;
    listEl.setAttr("role", "listbox");
    listEl.setAttr("aria-labelledby", parentLabelId);

    const render = (scrollBehavior: "initial" | "preserve" = "preserve"): void => {
      listEl.empty();
      this.listByPath.clear();

      const filtered = this.getFilteredFolders();
      if (filtered.length === 0) {
        listEl.removeAttribute("aria-activedescendant");
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

      filtered.forEach((folderPath, index) => {
        const optionEl = listEl.createDiv({
          cls: "move-to-new-folder-item",
        });
        optionEl.dataset.path = folderPath;
        optionEl.id = `${idPrefix}-option-${index}`;
        optionEl.setAttr("role", "option");
        optionEl.setAttr("aria-selected", "false");

        const rowEl = optionEl.createDiv({ cls: "move-to-new-folder-item-row" });
        rowEl.createSpan({
          cls: "move-to-new-folder-item-label",
          text: folderPath.length > 0 ? folderPath : "/",
        });

        if (folderPath === this.selectedPath) {
          optionEl.addClass("is-selected");
        }

        optionEl.addEventListener("mousedown", (event) => {
          event.preventDefault();
        });

        optionEl.addEventListener("click", () => {
          const selectedPathIndex = filtered.indexOf(folderPath);
          if (selectedPathIndex >= 0) {
            this.selectedIndex = selectedPathIndex;
          }
          this.selectedPath = folderPath;
          this.refreshSelection(listEl, filtered, "preserve");
          listEl.focus();
        });

        optionEl.addEventListener("mouseenter", () => {
          optionEl.addClass("is-hovered");
        });

        optionEl.addEventListener("mouseleave", () => {
          optionEl.removeClass("is-hovered");
        });

        this.listByPath.set(folderPath, optionEl);
      });

      this.refreshSelection(listEl, filtered, scrollBehavior);

      if (scrollBehavior === "initial" && !this.hasRevealedInitialSelection) {
        this.revealInitialSelection(listEl);
      }
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
      render("preserve");
    });

    searchInput.addEventListener("keydown", (event) => {
      const filtered = this.getFilteredFolders();

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (filtered.length > 0) {
          this.moveListSelection(listEl, filtered, 1);
          listEl.focus();
        }
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (filtered.length > 0) {
          this.moveListSelection(listEl, filtered, -1);
          listEl.focus();
        }
      }

      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    });

    listEl.addEventListener("keydown", (event) => {
      const filtered = this.getFilteredFolders();

      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.moveListSelection(listEl, filtered, 1);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.moveListSelection(listEl, filtered, -1);
      }

      if (event.key === "Home") {
        event.preventDefault();
        this.moveListSelectionToIndex(listEl, filtered, 0);
      }

      if (event.key === "End") {
        event.preventDefault();
        this.moveListSelectionToIndex(listEl, filtered, filtered.length - 1);
      }

      if (event.key === "Enter" || event.key === " ") {
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
    cancelButton.addEventListener("keydown", (event) => {
      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        if (!moveButton.disabled) {
          moveButton.focus();
          return;
        }

        nameInput.focus();
        nameInput.select();
      }
    });

    const moveButton = actionsEl.createEl("button", {
      text: this.targetKind === "folder" ? "Move folder" : "Move file",
      cls: "mod-cta",
    });
    moveButton.type = "button";
    moveButton.addEventListener("keydown", (event) => {
      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        nameInput.focus();
        nameInput.select();
      }
    });

    const updateValidationState = (): FolderNameValidationResult => {
      const validation = validateFolderNameForCurrentPlatform(nameInput.value);

      const shouldShowError = !validation.isValid && (this.hasEditedFolderName || this.hasTriedSubmit);
      validationEl.toggleClass("is-invalid", shouldShowError);
      validationEl.setText(shouldShowError && validation.message ? validation.message : "");
      nameInput.setAttr("aria-invalid", shouldShowError ? "true" : "false");
      return validation;
    };

    nameInput.addEventListener("input", () => {
      this.folderName = nameInput.value;
      this.hasEditedFolderName = true;
      updateValidationState();
    });

    nameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    });

    if (Platform.isMobile) {
      const scrollNameFieldIntoView = (): void => {
        this.scrollSectionIntoView(contentEl, nameSectionEl);
      };

      nameInput.addEventListener("focus", scrollNameFieldIntoView);
      nameInput.addEventListener("click", scrollNameFieldIntoView);
    }

    const submit = (): void => {
      this.hasTriedSubmit = true;
      const value = nameInput.value.trim();
      const validation = validateFolderNameForCurrentPlatform(value);
      updateValidationState();
      if (!validation.isValid) {
        if (validation.message) {
          new Notice(validation.message);
        }
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

    render("initial");
    updateValidationState();
    if (!Platform.isMobile) {
      nameInput.focus();
      nameInput.select();
    }
  }

  onClose(): void {
    if (!this.didResolve) {
      this.onCloseResolve(null);
    }
    this.modalEl.removeClass("move-to-new-folder-modal", "move-to-new-folder-modal-mobile");
    this.contentEl.empty();
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

  private refreshSelection(
    listEl: HTMLElement,
    filtered: string[],
    scrollBehavior: "initial" | "preserve",
  ): void {
    for (const [path, button] of this.listByPath.entries()) {
      const shouldSelect = path === this.selectedPath;
      button.toggleClass("is-selected", shouldSelect);
      button.setAttr("aria-selected", shouldSelect ? "true" : "false");
      if (shouldSelect) {
        if (scrollBehavior === "preserve" && !this.isElementFullyVisible(listEl, button)) {
          button.scrollIntoView({ block: "nearest" });
        }
        listEl.setAttr("aria-activedescendant", button.id);
      }
    }

    if (!filtered.includes(this.selectedPath) && filtered.length > 0) {
      this.selectedIndex = 0;
      this.selectedPath = filtered[0];
      this.refreshSelection(listEl, filtered, scrollBehavior);
    }
  }

  private isElementFullyVisible(containerEl: HTMLElement, itemEl: HTMLElement): boolean {
    const itemTop = itemEl.offsetTop;
    const itemBottom = itemTop + itemEl.offsetHeight;
    const visibleTop = containerEl.scrollTop;
    const visibleBottom = visibleTop + containerEl.clientHeight;
    return itemTop >= visibleTop && itemBottom <= visibleBottom;
  }

  private moveListSelection(
    listEl: HTMLElement,
    filtered: string[],
    delta: number,
  ): void {
    if (filtered.length === 0) {
      return;
    }

    this.selectedIndex = Math.max(0, Math.min(this.selectedIndex + delta, filtered.length - 1));
    this.selectedPath = filtered[this.selectedIndex];
    this.refreshSelection(listEl, filtered, "preserve");
  }

  private moveListSelectionToIndex(
    listEl: HTMLElement,
    filtered: string[],
    index: number,
  ): void {
    if (filtered.length === 0) {
      return;
    }

    this.selectedIndex = Math.max(0, Math.min(index, filtered.length - 1));
    this.selectedPath = filtered[this.selectedIndex];
    this.refreshSelection(listEl, filtered, "preserve");
  }

  private revealInitialSelection(listEl: HTMLElement): void {
    const selectedButton = this.listByPath.get(this.selectedPath);
    if (!selectedButton) {
      return;
    }

    const reveal = (): void => {
      selectedButton.scrollIntoView({
        block: "start",
        inline: "nearest",
      });
      this.hasRevealedInitialSelection = true;
    };

    window.requestAnimationFrame(() => {
      reveal();
      window.setTimeout(reveal, 0);
    });
  }

  private scrollSectionIntoView(containerEl: HTMLElement, sectionEl: HTMLElement): void {
    const scrollSection = (): void => {
      const containerRect = containerEl.getBoundingClientRect();
      const sectionRect = sectionEl.getBoundingClientRect();
      const currentTop = containerEl.scrollTop;
      const targetTop = Math.max(currentTop + (sectionRect.top - containerRect.top) - 12, 0);
      containerEl.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    };

    scrollSection();
    window.setTimeout(scrollSection, 150);
    window.setTimeout(scrollSection, 300);
  }

  private closeWithResult(result: MoveToNewFolderModalResult | null): void {
    this.didResolve = true;
    this.onCloseResolve(result);
    this.close();
  }
}
