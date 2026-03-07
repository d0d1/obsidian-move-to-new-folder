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
import {
  MoveToNewFolderModal,
  type MoveTargetKind,
  type MoveToNewFolderModalResult,
} from "./modals/moveToNewFolderModal";
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
          void this.runFileMoveFlow(context.file, context.leaf);
        }

        return true;
      },
    });

    this.addCommand({
      id: "move-folder-to-new-folder",
      name: "Move folder to new folder...",
      checkCallback: (checking) => {
        const folder = this.getActiveFolderContext();
        if (!folder) {
          return false;
        }

        if (!checking) {
          void this.runFolderMoveFlow(folder);
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
        if (this.isMarkdownFile(file)) {
          menu.addItem((item) => {
            item
              .setSection(this.moveMenuSection)
              .setTitle("Move file to new folder...")
              .setIcon("folder-plus")
              .onClick(() => {
                void this.runFileMoveFlow(file, leaf);
              });
          });
          return;
        }

        if (file instanceof TFolder && file.path.length > 0) {
          menu.addItem((item) => {
            item
              .setSection(this.moveMenuSection)
              .setTitle("Move folder to new folder...")
              .setIcon("folder-plus")
              .onClick(() => {
                void this.runFolderMoveFlow(file);
              });
          });
        }
      }),
    );
  }

  private async runFileMoveFlow(file: TFile, leaf?: WorkspaceLeaf): Promise<void> {
    const parentDefaultPath = this.settings.defaultToCurrentParent ? file.parent?.path ?? "" : "";
    const moveTarget = await this.promptForMoveTarget(parentDefaultPath, "file");
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

  private async runFolderMoveFlow(folder: TFolder): Promise<void> {
    const currentParentPath = folder.parent?.path ?? "";
    const moveTarget = await this.promptForMoveTarget(currentParentPath, "folder");
    if (moveTarget === null) {
      return;
    }

    const targetFolderPath = normalizePath(
      moveTarget.parentPath.length > 0
        ? `${moveTarget.parentPath}/${moveTarget.folderName}`
        : moveTarget.folderName,
    );

    const targetContainer = await this.ensureTargetFolder(targetFolderPath);
    if (!targetContainer) {
      return;
    }

    const targetChildPath = normalizePath(`${targetContainer.path}/${folder.name}`);
    const existingDestination = this.app.vault.getAbstractFileByPath(targetChildPath);
    if (existingDestination && existingDestination.path !== folder.path) {
      new Notice(`Move canceled: folder already exists at "${targetChildPath}".`);
      return;
    }

    try {
      await this.app.fileManager.renameFile(folder, targetChildPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Could not move folder: ${message}`);
      return;
    }

    new Notice(`Moved folder to "${targetFolderPath}".`);
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

  private async promptForMoveTarget(
    initialPath: string,
    targetKind: MoveTargetKind,
  ): Promise<MoveToNewFolderModalResult | null> {
    return new Promise((resolve) => {
      const modal = new MoveToNewFolderModal(this.app, initialPath, targetKind, (result) => {
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

  private getActiveFolderContext(): TFolder | null {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile?.parent && activeFile.parent.path.length > 0) {
      return activeFile.parent;
    }

    const fileExplorer = this.app.workspace.getLeavesOfType("file-explorer")[0]?.view;
    const navigator = (fileExplorer as { tree?: { focusedItem?: { file?: TAbstractFile } } } | undefined)?.tree;
    const focusedFile = navigator?.focusedItem?.file;
    return focusedFile instanceof TFolder && focusedFile.path.length > 0 ? focusedFile : null;
  }
}
