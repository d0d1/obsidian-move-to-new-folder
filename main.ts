import {
  App,
  MarkdownView,
  Menu,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TAbstractFile,
  TFile,
  TFolder,
  WorkspaceLeaf,
  normalizePath,
} from "obsidian";

interface MoveToNewFolderSettings {
  defaultToCurrentParent: boolean;
}

const DEFAULT_SETTINGS: MoveToNewFolderSettings = {
  defaultToCurrentParent: true,
};

interface MoveToNewFolderModalResult {
  parentPath: string;
  folderName: string;
}

class MoveToNewFolderModal extends Modal {
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

    nameInput.addEventListener("input", () => {
      this.folderName = nameInput.value;
    });

    const submit = (): void => {
      const value = nameInput.value.trim();
      if (!value) {
        new Notice("Folder name cannot be empty.");
        nameInput.focus();
        return;
      }

      if (value.includes("/") || value.includes("\\")) {
        new Notice("Folder name cannot contain path separators.");
        nameInput.focus();
        return;
      }

      this.folderName = value;
      this.closeWithResult({
        parentPath: this.selectedPath,
        folderName: value,
      });
    };

    const actionsEl = contentEl.createDiv({ cls: "move-to-new-folder-actions" });
    const cancelButton = actionsEl.createEl("button", {
      text: "Cancel",
      cls: "mod-muted",
    });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => this.closeWithResult(null));

    const chooseButton = actionsEl.createEl("button", {
      text: "Move file",
      cls: "mod-cta",
    });
    chooseButton.type = "button";
    chooseButton.addEventListener("click", submit);

    render();
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

class ConfirmationModal extends Modal {
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

class MoveToNewFolderSettingTab extends PluginSettingTab {
  private readonly plugin: MoveToNewFolderPlugin;

  constructor(app: App, plugin: MoveToNewFolderPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Move to New Folder settings" });

    new Setting(containerEl)
      .setName("Default parent to current note folder")
      .setDesc("When enabled, the folder picker starts at the current note's parent folder.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.defaultToCurrentParent).onChange(async (value) => {
          this.plugin.settings.defaultToCurrentParent = value;
          await this.plugin.saveSettings();
        });
      });
  }
}

export default class MoveToNewFolderPlugin extends Plugin {
  settings: MoveToNewFolderSettings = DEFAULT_SETTINGS;
  private readonly moveMenuSection = "action";

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new MoveToNewFolderSettingTab(this.app, this));

    this.addCommand({
      id: "move-note-to-new-folder",
      name: "Move file to new folder...",
      checkCallback: (checking) => {
        const context = this.getActiveMarkdownFileContext();
        if (!context) {
          return false;
        }

        if (!checking) {
          void this.runMoveFlow(context.file, context.leaf);
        }

        return true;
      },
    });

    this.app.workspace.onLayoutReady(() => {
      this.registerFileMenuAction();
    });
  }

  async loadSettings(): Promise<void> {
    const loaded = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private registerFileMenuAction(): void {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TAbstractFile, _source: string, leaf?: WorkspaceLeaf) => {
        if (!this.isMarkdownFile(file)) {
          return;
        }

        menu.addItem((item) => {
          item
            .setSection(this.moveMenuSection)
            .setTitle("Move file to new folder...")
            .setIcon("folder-plus")
            .onClick(() => {
              void this.runMoveFlow(file, leaf);
            });
        });
      }),
    );
  }

  private async runMoveFlow(file: TFile, leaf?: WorkspaceLeaf): Promise<void> {
    const parentDefaultPath = this.settings.defaultToCurrentParent ? file.parent?.path ?? "" : "";
    const moveTarget = await this.promptForMoveTarget(parentDefaultPath);
    if (moveTarget === null) {
      return;
    }

    const targetFolderPath = normalizePath(
      moveTarget.parentPath.length > 0
        ? `${moveTarget.parentPath}/${moveTarget.folderName}`
        : moveTarget.folderName,
    );

    const targetFolder = await this.ensureTargetFolder(targetFolderPath);
    if (!targetFolder) {
      return;
    }

    const targetFilePath = normalizePath(`${targetFolder.path}/${file.name}`);
    const existingDestination = this.app.vault.getAbstractFileByPath(targetFilePath);
    if (existingDestination && existingDestination.path !== file.path) {
      new Notice(`Move canceled: file already exists at "${targetFilePath}".`);
      return;
    }

    try {
      await this.app.fileManager.renameFile(file, targetFilePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Could not move note: ${message}`);
      return;
    }

    const movedFile = this.app.vault.getAbstractFileByPath(targetFilePath);
    if (movedFile instanceof TFile) {
      await this.openMovedFile(movedFile, leaf);
      new Notice(`Moved to "${targetFolderPath}".`);
      return;
    }

    new Notice(`Move completed, but could not reopen "${targetFilePath}".`);
  }

  private async ensureTargetFolder(targetFolderPath: string): Promise<TFolder | null> {
    const existing = this.app.vault.getAbstractFileByPath(targetFolderPath);

    if (existing instanceof TFolder) {
      const confirmed = await this.confirmReuseFolder(targetFolderPath);
      if (!confirmed) {
        return null;
      }
      return existing;
    }

    if (existing) {
      new Notice(`Cannot use "${targetFolderPath}": a file already exists at that path.`);
      return null;
    }

    try {
      await this.app.vault.createFolder(targetFolderPath);
    } catch (error) {
      const raceWinner = this.app.vault.getAbstractFileByPath(targetFolderPath);
      if (raceWinner instanceof TFolder) {
        return raceWinner;
      }

      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Could not create folder: ${message}`);
      return null;
    }

    const created = this.app.vault.getAbstractFileByPath(targetFolderPath);
    if (created instanceof TFolder) {
      return created;
    }

    new Notice(`Folder creation succeeded but "${targetFolderPath}" is unavailable.`);
    return null;
  }

  private async confirmReuseFolder(folderPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new ConfirmationModal(
        this.app,
        "Folder already exists",
        `Use existing folder "${folderPath}"?`,
        "Use folder",
        resolve,
      );
      modal.open();
    });
  }

  private async promptForMoveTarget(initialPath: string): Promise<MoveToNewFolderModalResult | null> {
    return new Promise((resolve) => {
      const modal = new MoveToNewFolderModal(this.app, initialPath, (result) => {
        resolve(result);
      });
      modal.open();
    });
  }

  private async openMovedFile(file: TFile, leaf?: WorkspaceLeaf): Promise<void> {
    const targetLeaf = leaf ?? this.app.workspace.getMostRecentLeaf();
    if (!targetLeaf) {
      return;
    }

    await targetLeaf.openFile(file, { active: true });
  }

  private getActiveMarkdownFileContext(): { file: TFile; leaf?: WorkspaceLeaf } | null {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "md") {
      return null;
    }

    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const leaf = markdownView?.leaf ?? this.app.workspace.getMostRecentLeaf();
    return { file, leaf: leaf ?? undefined };
  }

  private isMarkdownFile(file: TAbstractFile): file is TFile {
    return file instanceof TFile && file.extension === "md";
  }
}
