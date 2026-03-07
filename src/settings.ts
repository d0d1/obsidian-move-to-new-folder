import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

export interface MoveToNewFolderSettings {
  defaultToCurrentParent: boolean;
}

export const DEFAULT_SETTINGS: MoveToNewFolderSettings = {
  defaultToCurrentParent: true,
};

export class MoveToNewFolderSettingTab extends PluginSettingTab {
  private readonly plugin: Plugin & {
    settings: MoveToNewFolderSettings;
    saveSettings(): Promise<void>;
  };

  constructor(
    app: App,
    plugin: Plugin & {
      settings: MoveToNewFolderSettings;
      saveSettings(): Promise<void>;
    },
  ) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Default parent to current note folder")
      .setDesc("When enabled, the folder picker starts from the current note's parent folder.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.defaultToCurrentParent).onChange(async (value) => {
          this.plugin.settings.defaultToCurrentParent = value;
          await this.plugin.saveSettings();
        });
      });
  }
}
