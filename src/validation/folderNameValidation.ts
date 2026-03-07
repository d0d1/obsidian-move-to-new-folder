import { Platform } from "obsidian";

export interface FolderNameValidationResult {
  isValid: boolean;
  message: string | null;
}

function getInvalidFolderCharactersForCurrentPlatform(): string[] {
  if (Platform.isWin) {
    return ["\\", "/", ":", "*", "?", "\"", "<", ">", "|"];
  }

  if (Platform.isAndroidApp) {
    return ["\\", "/", ":", "*", "?", "<", ">", "\""];
  }

  if (Platform.isMacOS || Platform.isLinux || Platform.isIosApp) {
    return ["\\", "/", ":"];
  }

  return ["\\", "/", ":"];
}

function getCurrentPlatformLabel(): string {
  if (Platform.isWin) {
    return "Windows";
  }

  if (Platform.isAndroidApp) {
    return "Android";
  }

  if (Platform.isMacOS) {
    return "macOS";
  }

  if (Platform.isIosApp) {
    return "iOS/iPadOS";
  }

  if (Platform.isLinux) {
    return "Linux";
  }

  return "this platform";
}

export function validateFolderNameForCurrentPlatform(folderName: string): FolderNameValidationResult {
  const trimmedName = folderName.trim();

  if (!trimmedName) {
    return {
      isValid: false,
      message: "Folder name cannot be empty.",
    };
  }

  if (trimmedName.startsWith(".")) {
    return {
      isValid: false,
      message: "Folder name cannot start with a period.",
    };
  }

  const invalidCharacters = getInvalidFolderCharactersForCurrentPlatform();
  const invalidCharacter = invalidCharacters.find((character) => trimmedName.includes(character));
  if (invalidCharacter) {
    return {
      isValid: false,
      message: `“${invalidCharacter}” is not allowed on ${getCurrentPlatformLabel()}.`,
    };
  }

  if (Platform.isWin) {
    if (trimmedName.endsWith(".") || trimmedName.endsWith(" ")) {
      return {
        isValid: false,
        message: "Windows folder names cannot end with a period or space.",
      };
    }

    const reservedNames = new Set([
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
      "LPT9",
    ]);

    if (reservedNames.has(trimmedName.toUpperCase())) {
      return {
        isValid: false,
        message: `“${trimmedName}” is reserved on Windows.`,
      };
    }
  }

  return {
    isValid: true,
    message: null,
  };
}
