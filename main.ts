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

interface ParentFolderPickerResult {
  selectedPath: string | null;
}

interface TextPromptResult {
  value: string | null;
}

class ParentFolderPickerModal extends Modal {
  private readonly initialPath: string;
  private readonly onCloseResolve: (result: ParentFolderPickerResult) => void;
  private searchValue = "";
  private selectedIndex = 0;
  private selectedPath: string;
  private readonly folderPaths: string[];
  private readonly listByPath: Map<string, HTMLButtonElement> = new Map();
  private didResolve = false;

  constructor(app: App, initialPath: string, onCloseResolve: (result: ParentFolderPickerResult) => void) {
    super(app);
    this.initialPath = initialPath;
    this.selectedPath = initialPath;
    this.onCloseResolve = onCloseResolve;
    this.folderPaths = this.collectFolderPaths();

    if (!this.folderPaths.includes(this.selectedPath)) {
      this.selectedPath = "";
    }
  }

  onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass("move-to-new-folder-modal");
    contentEl.empty();
    contentEl.createEl("h2", { text: "Choose a parent folder" });
    contentEl.createEl("p", {
      text: "Search by typing or pick a folder from the list.",
      cls: "move-to-new-folder-hint",
    });

    const searchInput = contentEl.createEl("input", {
      type: "text",
      placeholder: "Search folders...",
      cls: "move-to-new-folder-search",
    });

    const listEl = contentEl.createDiv({ cls: "move-to-new-folder-list" });

    const render = (): void => {
      listEl.empty();
      this.listByPath.clear();

      const filtered = this.getFilteredFolders();
      if (filtered.length === 0) {
        listEl.createDiv({
          text: "No folders match your search.",
          cls: "move-to-new-folder-empty",
        });
        return;
      }

      if (this.selectedIndex >= filtered.length) {
        this.selectedIndex = 0;
      }

      const selectedByIndex = filtered[this.selectedIndex];
      this.selectedPath = selectedByIndex;

      for (const folderPath of filtered) {
        const button = listEl.createEl("button", {
          cls: "move-to-new-folder-item",
          text: folderPath.length > 0 ? folderPath : "/",
        });
        button.type = "button";
        button.dataset.path = folderPath;

        if (folderPath === this.selectedPath) {
          button.addClass("is-selected");
        }

        button.addEventListener("click", () => {
          this.selectedPath = folderPath;
          this.closeWithResult(folderPath);
        });

        button.addEventListener("mouseenter", () => {
          const idx = filtered.indexOf(folderPath);
          if (idx >= 0) {
            this.selectedIndex = idx;
            this.selectedPath = folderPath;
            this.refreshSelection(listEl, filtered);
          }
        });

        this.listByPath.set(folderPath, button);
      }

      this.refreshSelection(listEl, filtered);
    };

    searchInput.addEventListener("input", () => {
      this.searchValue = searchInput.value.trim();
      this.selectedIndex = 0;
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
        if (filtered.length > 0) {
          this.closeWithResult(filtered[this.selectedIndex]);
        }
      }
    });

    const actionsEl = contentEl.createDiv({ cls: "move-to-new-folder-actions" });
    const cancelButton = actionsEl.createEl("button", {
      text: "Cancel",
      cls: "mod-muted",
    });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => this.closeWithResult(null));

    const chooseButton = actionsEl.createEl("button", {
      text: "Choose",
      cls: "mod-cta",
    });
    chooseButton.type = "button";
    chooseButton.addEventListener("click", () => this.closeWithResult(this.selectedPath));

    render();
    searchInput.focus();
    searchInput.select();
  }

  onClose(): void {
    if (!this.didResolve) {
      this.onCloseResolve({ selectedPath: null });
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

  private closeWithResult(selectedPath: string | null): void {
    this.didResolve = true;
    this.onCloseResolve({ selectedPath });
    this.close();
  }
}

class TextPromptModal extends Modal {
  private readonly title: string;
  private readonly placeholder: string;
  private readonly submitText: string;
  private readonly onCloseResolve: (result: TextPromptResult) => void;
  private didResolve = false;

  constructor(
    app: App,
    title: string,
    placeholder: string,
    submitText: string,
    onCloseResolve: (result: TextPromptResult) => void,
  ) {
    super(app);
    this.title = title;
    this.placeholder = placeholder;
    this.submitText = submitText;
    this.onCloseResolve = onCloseResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.title });

    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: this.placeholder,
    });

    const hintEl = contentEl.createDiv({
      text: "Enter only a folder name, not a full path.",
      cls: "move-to-new-folder-hint",
    });

    const actionsEl = contentEl.createDiv({ cls: "move-to-new-folder-actions" });

    const cancelButton = actionsEl.createEl("button", {
      text: "Cancel",
      cls: "mod-muted",
    });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => this.closeWithResult(null));

    const submitButton = actionsEl.createEl("button", {
      text: this.submitText,
      cls: "mod-cta",
    });
    submitButton.type = "button";

    const submit = (): void => {
      const value = input.value.trim();
      if (!value) {
        new Notice("Folder name cannot be empty.");
        return;
      }

      if (value.includes("/") || value.includes("\\")) {
        hintEl.setText("Folder name cannot contain path separators.");
        return;
      }

      this.closeWithResult(value);
    };

    submitButton.addEventListener("click", submit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    });

    input.focus();
    input.select();
  }

  onClose(): void {
    if (!this.didResolve) {
      this.onCloseResolve({ value: null });
    }
    this.contentEl.empty();
  }

  private closeWithResult(value: string | null): void {
    this.didResolve = true;
    this.onCloseResolve({ value });
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
    contentEl.createEl("h2", { text: this.titleText });
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

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new MoveToNewFolderSettingTab(this.app, this));

    this.addCommand({
      id: "move-note-to-new-folder",
      name: "Move note to new folder",
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
            .setTitle("Move note to new folder")
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

    const pickedParent = await this.pickParentFolder(parentDefaultPath);
    if (pickedParent === null) {
      return;
    }

    const newFolderName = await this.promptForFolderName();
    if (newFolderName === null) {
      return;
    }

    const targetFolderPath = normalizePath(
      pickedParent.length > 0 ? `${pickedParent}/${newFolderName}` : newFolderName,
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

  private async pickParentFolder(initialPath: string): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = new ParentFolderPickerModal(this.app, initialPath, (result) => {
        resolve(result.selectedPath);
      });
      modal.open();
    });
  }

  private async promptForFolderName(): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = new TextPromptModal(
        this.app,
        "Create a new folder",
        "New folder name",
        "Continue",
        (result) => {
          resolve(result.value);
        },
      );
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
