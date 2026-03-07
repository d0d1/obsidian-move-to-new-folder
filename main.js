"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MoveToNewFolderPlugin
});
module.exports = __toCommonJS(main_exports);

// src/plugin.ts
var import_obsidian5 = require("obsidian");

// src/modals/confirmationModal.ts
var import_obsidian = require("obsidian");
var ConfirmationModal = class extends import_obsidian.Modal {
  constructor(app, titleText, bodyText, confirmText, onCloseResolve) {
    super(app);
    this.didResolve = false;
    this.titleText = titleText;
    this.bodyText = bodyText;
    this.confirmText = confirmText;
    this.onCloseResolve = onCloseResolve;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle(this.titleText);
    contentEl.createEl("p", { text: this.bodyText });
    const actionsEl = contentEl.createDiv({ cls: "move-to-new-folder-actions" });
    const cancelButton = actionsEl.createEl("button", {
      text: "Cancel",
      cls: "mod-muted"
    });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => this.closeWithResult(false));
    const confirmButton = actionsEl.createEl("button", {
      text: this.confirmText,
      cls: "mod-cta"
    });
    confirmButton.type = "button";
    confirmButton.addEventListener("click", () => this.closeWithResult(true));
  }
  onClose() {
    if (!this.didResolve) {
      this.onCloseResolve(false);
    }
    this.contentEl.empty();
  }
  closeWithResult(confirmed) {
    this.didResolve = true;
    this.onCloseResolve(confirmed);
    this.close();
  }
};

// src/modals/moveToNewFolderModal.ts
var import_obsidian3 = require("obsidian");

// src/validation/folderNameValidation.ts
var import_obsidian2 = require("obsidian");
function getInvalidFolderCharactersForCurrentPlatform() {
  if (import_obsidian2.Platform.isWin) {
    return ["\\", "/", ":", "*", "?", '"', "<", ">", "|"];
  }
  if (import_obsidian2.Platform.isAndroidApp) {
    return ["\\", "/", ":", "*", "?", "<", ">", '"'];
  }
  if (import_obsidian2.Platform.isMacOS || import_obsidian2.Platform.isLinux || import_obsidian2.Platform.isIosApp) {
    return ["\\", "/", ":"];
  }
  return ["\\", "/", ":"];
}
function getCurrentPlatformLabel() {
  if (import_obsidian2.Platform.isWin) {
    return "Windows";
  }
  if (import_obsidian2.Platform.isAndroidApp) {
    return "Android";
  }
  if (import_obsidian2.Platform.isMacOS) {
    return "macOS";
  }
  if (import_obsidian2.Platform.isIosApp) {
    return "iOS/iPadOS";
  }
  if (import_obsidian2.Platform.isLinux) {
    return "Linux";
  }
  return "this platform";
}
function validateFolderNameForCurrentPlatform(folderName) {
  const trimmedName = folderName.trim();
  if (!trimmedName) {
    return {
      isValid: false,
      message: "Folder name cannot be empty."
    };
  }
  if (trimmedName.startsWith(".")) {
    return {
      isValid: false,
      message: "Folder name cannot start with a period."
    };
  }
  const invalidCharacters = getInvalidFolderCharactersForCurrentPlatform();
  const invalidCharacter = invalidCharacters.find((character) => trimmedName.includes(character));
  if (invalidCharacter) {
    return {
      isValid: false,
      message: `\u201C${invalidCharacter}\u201D is not allowed on ${getCurrentPlatformLabel()}.`
    };
  }
  if (import_obsidian2.Platform.isWin) {
    if (trimmedName.endsWith(".") || trimmedName.endsWith(" ")) {
      return {
        isValid: false,
        message: "Windows folder names cannot end with a period or space."
      };
    }
    const reservedNames = /* @__PURE__ */ new Set([
      "CON",
      "PRN",
      "AUX",
      "NUL",
      "COM1",
      "COM2",
      "COM3",
      "COM4",
      "COM5",
      "COM6",
      "COM7",
      "COM8",
      "COM9",
      "LPT1",
      "LPT2",
      "LPT3",
      "LPT4",
      "LPT5",
      "LPT6",
      "LPT7",
      "LPT8",
      "LPT9"
    ]);
    if (reservedNames.has(trimmedName.toUpperCase())) {
      return {
        isValid: false,
        message: `\u201C${trimmedName}\u201D is reserved on Windows.`
      };
    }
  }
  return {
    isValid: true,
    message: null
  };
}

// src/modals/moveToNewFolderModal.ts
var MoveToNewFolderModal = class extends import_obsidian3.Modal {
  constructor(app, initialPath, targetKind, onCloseResolve) {
    super(app);
    this.searchValue = "";
    this.selectedIndex = 0;
    this.folderName = "";
    this.hasTriedSubmit = false;
    this.hasEditedFolderName = false;
    this.listByPath = /* @__PURE__ */ new Map();
    this.didResolve = false;
    this.hasRevealedInitialSelection = false;
    this.selectedPath = initialPath;
    this.targetKind = targetKind;
    this.onCloseResolve = onCloseResolve;
    this.folderPaths = this.collectFolderPaths();
    if (!this.folderPaths.includes(this.selectedPath)) {
      this.selectedPath = "";
    }
    const initialIndex = this.folderPaths.indexOf(this.selectedPath);
    this.selectedIndex = initialIndex >= 0 ? initialIndex : 0;
  }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("move-to-new-folder-modal");
    if (import_obsidian3.Platform.isMobile) {
      this.modalEl.addClass("move-to-new-folder-modal-mobile");
    }
    contentEl.empty();
    this.setTitle(this.targetKind === "folder" ? "Move folder to new folder" : "Move file to new folder");
    const layoutEl = contentEl.createDiv({ cls: "move-to-new-folder-layout" });
    const nameSectionEl = layoutEl.createDiv({
      cls: "move-to-new-folder-section move-to-new-folder-section-name"
    });
    const nameInput = nameSectionEl.createEl("input", {
      type: "text",
      placeholder: "New folder name",
      cls: "move-to-new-folder-text-input"
    });
    nameInput.value = this.folderName;
    nameInput.enterKeyHint = "done";
    const validationEl = nameSectionEl.createDiv({
      cls: "move-to-new-folder-validation"
    });
    const parentSectionEl = layoutEl.createDiv({
      cls: "move-to-new-folder-section move-to-new-folder-section-parent"
    });
    parentSectionEl.createEl("label", {
      text: "Parent folder",
      cls: "move-to-new-folder-label"
    });
    const selectedParentEl = parentSectionEl.createDiv({
      cls: "move-to-new-folder-parent-path"
    });
    const searchInput = parentSectionEl.createEl("input", {
      type: "text",
      placeholder: "Filter folders...",
      cls: "move-to-new-folder-search"
    });
    if (import_obsidian3.Platform.isMobile) {
      searchInput.tabIndex = -1;
    }
    const listEl = parentSectionEl.createDiv({ cls: "move-to-new-folder-list" });
    const updateSelectedParent = () => {
      selectedParentEl.empty();
      selectedParentEl.createSpan({
        cls: "move-to-new-folder-parent-badge",
        text: this.selectedPath.length > 0 ? this.selectedPath : "/"
      });
    };
    const render = (scrollBehavior = "preserve") => {
      listEl.empty();
      this.listByPath.clear();
      const filtered = this.getFilteredFolders();
      if (filtered.length === 0) {
        updateSelectedParent();
        listEl.createDiv({
          text: "No folders match your search.",
          cls: "move-to-new-folder-empty"
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
          cls: "move-to-new-folder-item"
        });
        button.type = "button";
        button.dataset.path = folderPath;
        const rowEl = button.createDiv({ cls: "move-to-new-folder-item-row" });
        rowEl.createSpan({
          cls: "move-to-new-folder-item-label",
          text: folderPath.length > 0 ? folderPath : "/"
        });
        if (folderPath === this.selectedPath) {
          button.addClass("is-selected");
        }
        button.addEventListener("click", () => {
          this.selectedPath = folderPath;
          render("preserve");
        });
        button.addEventListener("mouseenter", () => {
          button.addClass("is-hovered");
        });
        button.addEventListener("mouseleave", () => {
          button.removeClass("is-hovered");
        });
        this.listByPath.set(folderPath, button);
      }
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
          this.selectedIndex = Math.min(this.selectedIndex + 1, filtered.length - 1);
          this.selectedPath = filtered[this.selectedIndex];
          this.refreshSelection(listEl, filtered, "preserve");
        }
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (filtered.length > 0) {
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
          this.selectedPath = filtered[this.selectedIndex];
          this.refreshSelection(listEl, filtered, "preserve");
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
      cls: "mod-muted"
    });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => this.closeWithResult(null));
    const moveButton = actionsEl.createEl("button", {
      text: this.targetKind === "folder" ? "Move folder" : "Move file",
      cls: "mod-cta"
    });
    moveButton.type = "button";
    const updateValidationState = () => {
      const validation = validateFolderNameForCurrentPlatform(nameInput.value);
      const shouldShowError = !validation.isValid && (this.hasEditedFolderName || this.hasTriedSubmit);
      validationEl.toggleClass("is-invalid", shouldShowError);
      validationEl.setText(shouldShowError && validation.message ? validation.message : "");
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
    if (import_obsidian3.Platform.isMobile) {
      const scrollNameFieldIntoView = () => {
        this.scrollSectionIntoView(contentEl, nameSectionEl);
      };
      nameInput.addEventListener("focus", scrollNameFieldIntoView);
      nameInput.addEventListener("click", scrollNameFieldIntoView);
    }
    const submit = () => {
      this.hasTriedSubmit = true;
      const value = nameInput.value.trim();
      const validation = validateFolderNameForCurrentPlatform(value);
      updateValidationState();
      if (!validation.isValid) {
        if (validation.message) {
          new import_obsidian3.Notice(validation.message);
        }
        nameInput.focus();
        return;
      }
      this.folderName = value;
      this.closeWithResult({
        parentPath: this.selectedPath,
        folderName: value
      });
    };
    moveButton.addEventListener("click", submit);
    render("initial");
    if (!import_obsidian3.Platform.isMobile) {
      nameInput.focus();
      nameInput.select();
    }
  }
  onClose() {
    if (!this.didResolve) {
      this.onCloseResolve(null);
    }
    this.modalEl.removeClass("move-to-new-folder-modal", "move-to-new-folder-modal-mobile");
    this.contentEl.empty();
  }
  collectFolderPaths() {
    const folderSet = /* @__PURE__ */ new Set([""]);
    for (const item of this.app.vault.getAllLoadedFiles()) {
      if (item instanceof import_obsidian3.TFolder) {
        folderSet.add(item.path);
      }
    }
    return Array.from(folderSet).sort((a, b) => a.localeCompare(b));
  }
  getFilteredFolders() {
    if (!this.searchValue) {
      return this.folderPaths;
    }
    const needle = this.searchValue.toLocaleLowerCase();
    return this.folderPaths.filter((path) => {
      const haystack = path.length > 0 ? path.toLocaleLowerCase() : "/";
      return haystack.includes(needle);
    });
  }
  refreshSelection(listEl, filtered, scrollBehavior) {
    for (const [path, button] of this.listByPath.entries()) {
      const shouldSelect = path === this.selectedPath;
      button.toggleClass("is-selected", shouldSelect);
      if (shouldSelect) {
        if (scrollBehavior === "preserve" && !this.isElementFullyVisible(listEl, button)) {
          button.scrollIntoView({ block: "nearest" });
        }
      }
    }
    if (!filtered.includes(this.selectedPath) && filtered.length > 0) {
      this.selectedIndex = 0;
      this.selectedPath = filtered[0];
      this.refreshSelection(listEl, filtered, scrollBehavior);
    }
  }
  isElementFullyVisible(containerEl, itemEl) {
    const itemTop = itemEl.offsetTop;
    const itemBottom = itemTop + itemEl.offsetHeight;
    const visibleTop = containerEl.scrollTop;
    const visibleBottom = visibleTop + containerEl.clientHeight;
    return itemTop >= visibleTop && itemBottom <= visibleBottom;
  }
  revealInitialSelection(listEl) {
    const selectedButton = this.listByPath.get(this.selectedPath);
    if (!selectedButton) {
      return;
    }
    window.requestAnimationFrame(() => {
      const targetTop = Math.max(selectedButton.offsetTop - 8, 0);
      listEl.scrollTop = targetTop;
      this.hasRevealedInitialSelection = true;
    });
  }
  scrollSectionIntoView(containerEl, sectionEl) {
    const scrollSection = () => {
      const containerRect = containerEl.getBoundingClientRect();
      const sectionRect = sectionEl.getBoundingClientRect();
      const currentTop = containerEl.scrollTop;
      const targetTop = Math.max(currentTop + (sectionRect.top - containerRect.top) - 12, 0);
      containerEl.scrollTo({
        top: targetTop,
        behavior: "smooth"
      });
    };
    scrollSection();
    window.setTimeout(scrollSection, 150);
    window.setTimeout(scrollSection, 300);
  }
  closeWithResult(result) {
    this.didResolve = true;
    this.onCloseResolve(result);
    this.close();
  }
};

// src/settings.ts
var import_obsidian4 = require("obsidian");
var DEFAULT_SETTINGS = {
  defaultToCurrentParent: true
};
var MoveToNewFolderSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian4.Setting(containerEl).setName("Default parent to current note folder").setDesc("When enabled, the folder picker starts from the current note's parent folder.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.defaultToCurrentParent).onChange(async (value) => {
        this.plugin.settings.defaultToCurrentParent = value;
        await this.plugin.saveSettings();
      });
    });
  }
};

// src/plugin.ts
var MoveToNewFolderPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.moveMenuSection = "action";
  }
  async onload() {
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
      }
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
      }
    });
    this.app.workspace.onLayoutReady(() => {
      this.registerFileMenuAction();
    });
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  registerFileMenuAction() {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, _source, leaf) => {
        if (this.isMarkdownFile(file)) {
          menu.addItem((item) => {
            item.setSection(this.moveMenuSection).setTitle("Move file to new folder...").setIcon("folder-plus").onClick(() => {
              void this.runFileMoveFlow(file, leaf);
            });
          });
          return;
        }
        if (file instanceof import_obsidian5.TFolder && file.path.length > 0) {
          menu.addItem((item) => {
            item.setSection(this.moveMenuSection).setTitle("Move folder to new folder...").setIcon("folder-plus").onClick(() => {
              void this.runFolderMoveFlow(file);
            });
          });
        }
      })
    );
  }
  async runFileMoveFlow(file, leaf) {
    var _a, _b;
    const parentDefaultPath = this.settings.defaultToCurrentParent ? (_b = (_a = file.parent) == null ? void 0 : _a.path) != null ? _b : "" : "";
    const moveTarget = await this.promptForMoveTarget(parentDefaultPath, "file");
    if (moveTarget === null) {
      return;
    }
    const targetFolderPath = (0, import_obsidian5.normalizePath)(
      moveTarget.parentPath.length > 0 ? `${moveTarget.parentPath}/${moveTarget.folderName}` : moveTarget.folderName
    );
    const targetFolder = await this.ensureTargetFolder(targetFolderPath);
    if (!targetFolder) {
      return;
    }
    const targetFilePath = (0, import_obsidian5.normalizePath)(`${targetFolder.path}/${file.name}`);
    const existingDestination = this.app.vault.getAbstractFileByPath(targetFilePath);
    if (existingDestination && existingDestination.path !== file.path) {
      new import_obsidian5.Notice(`Move canceled: file already exists at "${targetFilePath}".`);
      return;
    }
    try {
      await this.app.fileManager.renameFile(file, targetFilePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new import_obsidian5.Notice(`Could not move note: ${message}`);
      return;
    }
    const movedFile = this.app.vault.getAbstractFileByPath(targetFilePath);
    if (movedFile instanceof import_obsidian5.TFile) {
      await this.openMovedFile(movedFile, leaf);
      new import_obsidian5.Notice(`Moved to "${targetFolderPath}".`);
      return;
    }
    new import_obsidian5.Notice(`Move completed, but could not reopen "${targetFilePath}".`);
  }
  async runFolderMoveFlow(folder) {
    var _a, _b;
    const currentParentPath = (_b = (_a = folder.parent) == null ? void 0 : _a.path) != null ? _b : "";
    const moveTarget = await this.promptForMoveTarget(currentParentPath, "folder");
    if (moveTarget === null) {
      return;
    }
    const targetFolderPath = (0, import_obsidian5.normalizePath)(
      moveTarget.parentPath.length > 0 ? `${moveTarget.parentPath}/${moveTarget.folderName}` : moveTarget.folderName
    );
    const targetContainer = await this.ensureTargetFolder(targetFolderPath);
    if (!targetContainer) {
      return;
    }
    const targetChildPath = (0, import_obsidian5.normalizePath)(`${targetContainer.path}/${folder.name}`);
    const existingDestination = this.app.vault.getAbstractFileByPath(targetChildPath);
    if (existingDestination && existingDestination.path !== folder.path) {
      new import_obsidian5.Notice(`Move canceled: folder already exists at "${targetChildPath}".`);
      return;
    }
    try {
      await this.app.fileManager.renameFile(folder, targetChildPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new import_obsidian5.Notice(`Could not move folder: ${message}`);
      return;
    }
    new import_obsidian5.Notice(`Moved folder to "${targetFolderPath}".`);
  }
  async ensureTargetFolder(targetFolderPath) {
    const existing = this.app.vault.getAbstractFileByPath(targetFolderPath);
    if (existing instanceof import_obsidian5.TFolder) {
      const confirmed = await this.confirmReuseFolder(targetFolderPath);
      if (!confirmed) {
        return null;
      }
      return existing;
    }
    if (existing) {
      new import_obsidian5.Notice(`Cannot use "${targetFolderPath}": a file already exists at that path.`);
      return null;
    }
    try {
      await this.app.vault.createFolder(targetFolderPath);
    } catch (error) {
      const raceWinner = this.app.vault.getAbstractFileByPath(targetFolderPath);
      if (raceWinner instanceof import_obsidian5.TFolder) {
        return raceWinner;
      }
      const message = error instanceof Error ? error.message : String(error);
      new import_obsidian5.Notice(`Could not create folder: ${message}`);
      return null;
    }
    const created = this.app.vault.getAbstractFileByPath(targetFolderPath);
    if (created instanceof import_obsidian5.TFolder) {
      return created;
    }
    new import_obsidian5.Notice(`Folder creation succeeded but "${targetFolderPath}" is unavailable.`);
    return null;
  }
  async confirmReuseFolder(folderPath) {
    return new Promise((resolve) => {
      const modal = new ConfirmationModal(
        this.app,
        "Folder already exists",
        `Use existing folder "${folderPath}"?`,
        "Use folder",
        resolve
      );
      modal.open();
    });
  }
  async promptForMoveTarget(initialPath, targetKind) {
    return new Promise((resolve) => {
      const modal = new MoveToNewFolderModal(this.app, initialPath, targetKind, (result) => {
        resolve(result);
      });
      modal.open();
    });
  }
  async openMovedFile(file, leaf) {
    const targetLeaf = leaf != null ? leaf : this.app.workspace.getMostRecentLeaf();
    if (!targetLeaf) {
      return;
    }
    await targetLeaf.openFile(file, { active: true });
  }
  getActiveMarkdownFileContext() {
    var _a;
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "md") {
      return null;
    }
    const markdownView = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    const leaf = (_a = markdownView == null ? void 0 : markdownView.leaf) != null ? _a : this.app.workspace.getMostRecentLeaf();
    return { file, leaf: leaf != null ? leaf : void 0 };
  }
  isMarkdownFile(file) {
    return file instanceof import_obsidian5.TFile && file.extension === "md";
  }
  getActiveFolderContext() {
    var _a, _b;
    const activeFile = this.app.workspace.getActiveFile();
    if ((activeFile == null ? void 0 : activeFile.parent) && activeFile.parent.path.length > 0) {
      return activeFile.parent;
    }
    const fileExplorer = (_a = this.app.workspace.getLeavesOfType("file-explorer")[0]) == null ? void 0 : _a.view;
    const navigator = fileExplorer == null ? void 0 : fileExplorer.tree;
    const focusedFile = (_b = navigator == null ? void 0 : navigator.focusedItem) == null ? void 0 : _b.file;
    return focusedFile instanceof import_obsidian5.TFolder && focusedFile.path.length > 0 ? focusedFile : null;
  }
};
