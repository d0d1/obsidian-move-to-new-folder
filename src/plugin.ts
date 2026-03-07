import {
  MarkdownView,
  Menu,
  Notice,
  Plugin,
  TAbstractFile,
  TFile,
  TFolder,
  WorkspaceLeaf,
  normalizePath,
} from "obsidian";

import { ConfirmationModal } from "./modals/confirmationModal";
import { MoveToNewFolderModal, type MoveToNewFolderModalResult } from "./modals/moveToNewFolderModal";
import { DEFAULT_SETTINGS, MoveToNewFolderSettingTab, type MoveToNewFolderSettings } from "./settings";

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
