/**
 * Git Service
 * Handles repository cloning, file extraction, and cleanup
 */

import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileContent } from '@bobinsight/shared-types';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errorHandler';

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/bobinsight';
const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rb'];
const MAX_FILE_SIZE = 500 * 1024; // 500KB max per file
const MAX_FILES = 200; // Maximum 200 files to prevent memory issues

/**
 * Generates a unique directory name for cloning
 */
function generateTempPath(repoUrl: string): string {
  const hash = Buffer.from(repoUrl).toString('base64').replace(/[/+=]/g, '');
  const timestamp = Date.now();
  return path.join(TEMP_DIR, `${hash}-${timestamp}`);
}

/**
 * Clones a GitHub repository to a temporary directory
 * @param repoUrl - Validated GitHub repository URL
 * @returns Path to the cloned repository
 */
export async function cloneRepository(repoUrl: string): Promise<string> {
  const clonePath = generateTempPath(repoUrl);

  try {
    logger.info('Cloning repository', { repoUrl, clonePath });

    // Ensure temp directory exists
    await fs.mkdir(TEMP_DIR, { recursive: true });

    // Initialize simple-git with safe options
    const git: SimpleGit = simpleGit({
      baseDir: TEMP_DIR,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: false
    });

    // Clone with depth 1 for faster cloning (shallow clone)
    await git.clone(repoUrl, clonePath, ['--depth', '1']);

    logger.info('Repository cloned successfully', { clonePath });
    return clonePath;
  } catch (error) {
    logger.error('Failed to clone repository', error, { repoUrl });
    
    // Cleanup on failure
    await cleanup(clonePath).catch(() => {});
    
    throw new AppError(
      'Failed to clone repository. Please check the URL and try again.',
      500
    );
  }
}

/**
 * Recursively extracts all supported files from the cloned repository
 * @param repoPath - Path to the cloned repository
 * @returns Array of file contents
 */
export async function extractFiles(repoPath: string): Promise<FileContent[]> {
  const files: FileContent[] = [];

  try {
    logger.info('Extracting files from repository', { repoPath });

    await walkDirectory(repoPath, repoPath, files);

    logger.info('Files extracted successfully', { 
      repoPath, 
      fileCount: files.length 
    });

    return files;
  } catch (error) {
    logger.error('Failed to extract files', error, { repoPath });
    throw new AppError('Failed to extract files from repository', 500);
  }
}

/**
 * Recursively walks through directory and collects file contents
 */
async function walkDirectory(
  currentPath: string,
  basePath: string,
  files: FileContent[]
): Promise<void> {
  // Stop if we've reached the file limit
  if (files.length >= MAX_FILES) {
    logger.warn('Reached maximum file limit', { maxFiles: MAX_FILES });
    return;
  }

  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    // Check limit again in loop
    if (files.length >= MAX_FILES) {
      break;
    }

    const fullPath = path.join(currentPath, entry.name);

    // Skip hidden files, node_modules, and common build directories
    if (shouldSkip(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, basePath, files);
    } else if (entry.isFile()) {
      const extension = path.extname(entry.name);
      
      if (SUPPORTED_EXTENSIONS.includes(extension)) {
        try {
          // Check file size before reading
          const stats = await fs.stat(fullPath);
          if (stats.size > MAX_FILE_SIZE) {
            logger.warn('Skipping large file', {
              fullPath,
              size: stats.size,
              maxSize: MAX_FILE_SIZE
            });
            continue;
          }

          const content = await fs.readFile(fullPath, 'utf-8');
          const relativePath = path.relative(basePath, fullPath);

          files.push({
            path: relativePath,
            content,
            extension
          });
        } catch (error) {
          logger.warn('Failed to read file', { fullPath, error });
          // Continue processing other files
        }
      }
    }
  }
}

/**
 * Determines if a file/directory should be skipped
 */
function shouldSkip(name: string): boolean {
  const skipPatterns = [
    '.git',
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.next',
    '.nuxt',
    'vendor',
    '__pycache__',
    '.pytest_cache',
    'target',
    'bin',
    'obj'
  ];

  return name.startsWith('.') || skipPatterns.includes(name);
}

/**
 * Cleans up the cloned repository directory
 * @param repoPath - Path to the cloned repository
 */
export async function cleanup(repoPath: string): Promise<void> {
  try {
    logger.info('Cleaning up repository', { repoPath });

    await fs.rm(repoPath, { recursive: true, force: true });

    logger.info('Repository cleaned up successfully', { repoPath });
  } catch (error) {
    logger.error('Failed to cleanup repository', error, { repoPath });
    // Don't throw error on cleanup failure
  }
}

/**
 * Cleans up old temporary directories (older than 1 hour)
 */
export async function cleanupOldRepos(): Promise<void> {
  try {
    const entries = await fs.readdir(TEMP_DIR, { withFileTypes: true });
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(TEMP_DIR, entry.name);
        const stats = await fs.stat(dirPath);
        const age = now - stats.mtimeMs;

        if (age > oneHour) {
          await cleanup(dirPath);
        }
      }
    }

    logger.info('Old repositories cleaned up');
  } catch (error) {
    logger.error('Failed to cleanup old repositories', error);
  }
}
