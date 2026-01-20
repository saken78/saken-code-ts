/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Comprehensive Tool Validation Wrapper
 * Priority Rules Implementation:
 * - Priority 4: NEVER create files unless necessary (check exists first)
 * - Priority 5: Use absolute paths always (resolve relative → absolute)
 * - Priority 6: Read file BEFORE edit (dependency enforcement)
 * - Priority 7: No guessing URLs (whitelist only)
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileAccessValidator } from './file-access-validation.js';

/**
 * Tool validation result interface
 */
export interface ToolValidationResult {
  isValid: boolean;
  message?: string;
  correctedValue?: string;
  shouldBlockExecution?: boolean;
}

/**
 * Configuration for tool validation
 */
export interface ToolValidationConfig {
  requireReadBeforeEdit?: boolean;
  allowUnnecessaryFileCreation?: boolean;
  autoResolveToAbsolute?: boolean;
  baseDir?: string;
  urlWhitelist?: RegExp[];
  allowUserProvidedUrls?: boolean;
  blockHallucinatedUrls?: boolean;
}

/**
 * Comprehensive tool validation system for all priority rules
 */
export class ToolValidationWrapper {
  private config: ToolValidationConfig;
  private userProvidedUrls: Set<string> = new Set();

  constructor(config: ToolValidationConfig = {}) {
    this.config = {
      requireReadBeforeEdit: true,
      allowUnnecessaryFileCreation: false,
      autoResolveToAbsolute: true,
      blockHallucinatedUrls: true,
      allowUserProvidedUrls: true,
      ...config,
    };
  }

  /**
   * Priority 4: Validate file creation - NEVER create files unless necessary
   * Check if file already exists before allowing creation
   */
  validateFileCreation(filePath: string): ToolValidationResult {
    if (!this.config.allowUnnecessaryFileCreation) {
      try {
        const fileExists = fs.existsSync(filePath);
        if (fileExists) {
          return {
            isValid: false,
            shouldBlockExecution: true,
            message: `File already exists at ${filePath}. Cannot create unnecessarily. Use edit tool to modify existing file.`,
          };
        }
      } catch (err) {
        console.warn(`Could not check if file exists: ${filePath}`, err);
      }
    }

    return { isValid: true };
  }

  /**
   * Priority 5: Validate and resolve paths - ensure absolute paths ALWAYS
   * Auto-convert relative paths to absolute paths
   */
  validateAndResolvePath(
    filePath: string,
    baseDir?: string,
  ): ToolValidationResult {
    if (!filePath) {
      return {
        isValid: false,
        shouldBlockExecution: true,
        message: 'File path cannot be empty',
      };
    }

    try {
      let resolvedPath = filePath;

      // Auto-convert relative to absolute paths
      if (this.config.autoResolveToAbsolute && !path.isAbsolute(filePath)) {
        const baseDirectory = baseDir || this.config.baseDir || process.cwd();
        resolvedPath = path.resolve(baseDirectory, filePath);

        return {
          isValid: true,
          correctedValue: resolvedPath,
          message: `Path auto-converted to absolute: ${resolvedPath}`,
        };
      }

      // Validate absolute path requirement
      if (!path.isAbsolute(filePath)) {
        return {
          isValid: false,
          shouldBlockExecution: true,
          message: `Path must be absolute, got relative: ${filePath}\nExpected: /absolute/path/to/file`,
        };
      }

      // Check for path traversal or suspicious patterns
      if (filePath.includes('//') || filePath.includes('\\')) {
        return {
          isValid: false,
          shouldBlockExecution: true,
          message: `Invalid path pattern detected: ${filePath}`,
        };
      }

      return { isValid: true, correctedValue: filePath };
    } catch (_err) {
      return {
        isValid: false,
        shouldBlockExecution: true,
        message: `Failed to validate path: ${filePath}`,
      };
    }
  }

  /**
   * Priority 6: Enforce read-before-edit dependency
   * File MUST be read via ReadFile tool BEFORE editing
   */
  validateReadBeforeEdit(
    filePath: string,
    isNewFile: boolean = false,
  ): ToolValidationResult {
    if (!this.config.requireReadBeforeEdit) {
      return { isValid: true };
    }

    // New files don't need to be read first
    if (isNewFile) {
      return { isValid: true };
    }

    // Check if file has been read via ReadFile tool
    if (!fileAccessValidator.hasFileBeenAccessed(filePath)) {
      return {
        isValid: false,
        shouldBlockExecution: true,
        message: `File must be READ BEFORE EDIT.\nStep 1: Use Read tool to read: ${filePath}\nStep 2: Then use Edit tool to modify\n\nThis ensures you understand the current content.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Priority 7: Validate URLs - NO guessing/hallucination
   * Only allows: whitelist + user-provided + trusted domains
   */
  validateUrl(
    url: string,
    isUserProvided: boolean = false,
  ): ToolValidationResult {
    if (!this.config.blockHallucinatedUrls) {
      return { isValid: true };
    }

    if (!url) {
      return { isValid: false, message: 'URL cannot be empty' };
    }

    try {
      new URL(url); // Validate URL format
    } catch {
      return { isValid: false, message: `Invalid URL format: ${url}` };
    }

    // Allow user-provided URLs
    if (isUserProvided && this.config.allowUserProvidedUrls) {
      this.userProvidedUrls.add(url);
      return { isValid: true };
    }

    // Check against custom whitelist
    if (this.config.urlWhitelist && this.config.urlWhitelist.length > 0) {
      const isWhitelisted = this.config.urlWhitelist.some((pattern) =>
        pattern.test(url),
      );
      if (isWhitelisted) {
        return { isValid: true };
      }
    }

    // Check if URL was previously provided by user
    if (this.userProvidedUrls.has(url)) {
      return { isValid: true };
    }

    // Default trusted domains whitelist
    const defaultWhitelist = [
      /^https?:\/\/(www\.)?github\.com\//,
      /^https?:\/\/(www\.)?npmjs\.com\//,
      /^https?:\/\/(www\.)?npm\.org\//,
      /^https?:\/\/(www\.)?nodejs\.org\//,
      /^https?:\/\/(www\.)?typescript\.org\//,
      /^https?:\/\/(www\.)?react\.dev\//,
      /^https?:\/\/(www\.)?angular\.io\//,
      /^https?:\/\/(www\.)?vue\.js\//,
      /^https?:\/\/docs\./,
      /^https?:\/\/api\./,
    ];

    const isDefaultWhitelisted = defaultWhitelist.some((pattern) =>
      pattern.test(url),
    );

    if (isDefaultWhitelisted) {
      return { isValid: true };
    }

    // URL not whitelisted and not user-provided - BLOCK IT
    return {
      isValid: false,
      shouldBlockExecution: true,
      message: `URL blocked - not whitelisted: ${url}\nTo use this URL, provide it explicitly in your command.`,
    };
  }

  /**
   * Register URL as explicitly provided by user
   */
  registerUserProvidedUrl(url: string): void {
    this.userProvidedUrls.add(url);
  }

  /**
   * Comprehensive file operation validation
   */
  validateFileOperation(
    operation: 'read' | 'write' | 'edit' | 'create',
    filePath: string,
    options?: {
      isNewFile?: boolean;
      baseDir?: string;
    },
  ): ToolValidationResult {
    // Always validate path first (Priority 5)
    const pathValidation = this.validateAndResolvePath(
      filePath,
      options?.baseDir,
    );
    if (!pathValidation.isValid) {
      return pathValidation;
    }

    const resolvedPath = pathValidation.correctedValue || filePath;

    switch (operation) {
      case 'create':
        // Priority 4: Check file doesn't exist
        return this.validateFileCreation(resolvedPath);

      case 'write':
        // Priority 4: Check file doesn't exist
        return this.validateFileCreation(resolvedPath);

      case 'edit':
        // Priority 6: Must read before edit
        return this.validateReadBeforeEdit(resolvedPath, options?.isNewFile);

      case 'read':
        // Reading is always allowed
        return { isValid: true };

      default:
        return { isValid: true };
    }
  }

  clearUserProvidedUrls(): void {
    this.userProvidedUrls.clear();
  }

  getUserProvidedUrls(): string[] {
    return Array.from(this.userProvidedUrls);
  }
}

// Singleton instance with strict validation
export const toolValidator = new ToolValidationWrapper({
  requireReadBeforeEdit: true,
  allowUnnecessaryFileCreation: false,
  autoResolveToAbsolute: true,
  blockHallucinatedUrls: true,
  allowUserProvidedUrls: true,
});

/**
 * Legacy API - compatible with existing code
 */

type ValidatedEditResult =
  | {
      success: true;
      message: string;
      filePath: string;
      oldString: string;
      newString: string;
      replaceAll: boolean;
    }
  | {
      success: false;
      error: string;
    };

function validatedEdit(
  filePath: string,
  oldString: string,
  newString: string,
  replaceAll: boolean = false,
): ValidatedEditResult {
  const validation = fileAccessValidator.validateFileEdit(filePath);

  if (!validation.isValid) {
    return {
      success: false,
      error: validation.message,
    };
  }

  return {
    success: true,
    message: `Edit allowed for: ${filePath}`,
    filePath,
    oldString,
    newString,
    replaceAll,
  };
}

type ValidatedWriteFileResult =
  | {
      success: true;
      message: string;
      filePath: string;
      content: string;
    }
  | {
      success: false;
      error: string;
    };

function validatedWriteFile(
  filePath: string,
  content: string,
  isNewFile: boolean = false,
): ValidatedWriteFileResult {
  const validation = fileAccessValidator.validateFileEdit(filePath, isNewFile);

  if (!validation.isValid) {
    return {
      success: false,
      error: validation.message,
    };
  }

  return {
    success: true,
    message: `Write allowed for: ${filePath}`,
    filePath,
    content,
  };
}

function recordFileReadAccess(filePath: string): void {
  fileAccessValidator.recordFileAccess(filePath);
}

type ValidatedReadFileResult = {
  success: true;
  message: string;
  filePath: string;
};

function validatedReadFile(filePath: string): ValidatedReadFileResult {
  fileAccessValidator.recordFileAccess(filePath);

  return {
    success: true,
    message: `File read: ${filePath}`,
    filePath,
  };
}

export {
  validatedEdit,
  validatedWriteFile,
  recordFileReadAccess,
  validatedReadFile,
};
