#!/usr/bin/env node
// Polza AI-related utility functions

// Check if use is already defined (when imported from solve.mjs)
// If not, fetch it (when running standalone)
if (typeof globalThis.use === 'undefined') {
  globalThis.use = (await eval(await (await fetch('https://unpkg.com/use-m/use.js')).text())).use;
}

const { $ } = await use('command-stream');
const fs = (await use('fs')).promises;
const path = (await use('path')).default;
const os = (await use('os')).default;

// Import log from general lib
import { log } from './lib.mjs';
import { reportError } from './sentry.lib.mjs';
import { timeouts } from './config.lib.mjs';
import { detectUsageLimit, formatUsageLimitMessage } from './usage-limit.lib.mjs';

// Model mapping to translate aliases to full model IDs for Polza AI
export const mapModelToId = (model) => {
  const modelMap = {
    // Claude models via Polza
    'sonnet': 'anthropic/claude-3-5-sonnet-20250219',
    'claude-sonnet': 'anthropic/claude-3-5-sonnet-20250219',
    'sonnet-4': 'anthropic/claude-sonnet-4-20250514',
    'sonnet-4.5': 'anthropic/claude-sonnet-4-5-20250929',
    'opus': 'anthropic/claude-opus-4-20250418',
    'haiku': 'anthropic/claude-3-5-haiku-20250310',

    // OpenAI models via Polza
    'gpt4o': 'openai/gpt-4o',
    'gpt-4o': 'openai/gpt-4o',
    'gpt4': 'openai/gpt-4',
    'gpt-4': 'openai/gpt-4',
    'o1': 'openai/o1',
    'o1-preview': 'openai/o1-preview',

    // DeepSeek models via Polza
    'deepseek-r1': 'deepseek/deepseek-r1',
    'deepseek': 'deepseek/deepseek-chat',

    // Google models via Polza
    'gemini': 'google/gemini-pro',
    'gemini-pro': 'google/gemini-pro'
  };

  // Return mapped model ID if it's an alias, otherwise return as-is
  return modelMap[model] || model;
};

// Function to validate Polza AI connection
export const validatePolzaConnection = async (model = 'sonnet') => {
  // Map model alias to full ID
  const mappedModel = mapModelToId(model);

  // Retry configuration
  const maxRetries = 3;
  let retryCount = 0;

  const attemptValidation = async () => {
    try {
      if (retryCount === 0) {
        await log('🔍 Validating Polza AI connection...');
      } else {
        await log(`🔄 Retry attempt ${retryCount}/${maxRetries} for Polza AI validation...`);
      }

      // Check if agent-polza CLI is installed and get version
      try {
        const versionResult = await $`timeout ${Math.floor(timeouts.opencodeCli / 1000)} agent --version`;
        if (versionResult.code === 0) {
          const version = versionResult.stdout?.toString().trim();
          if (retryCount === 0) {
            await log(`📦 Polza Agent CLI version: ${version}`);
          }
        }
      } catch (versionError) {
        if (retryCount === 0) {
          await log(`⚠️  Polza Agent CLI version check failed (${versionError.code}), proceeding with connection test...`);
        }
      }

      // Test basic Polza AI functionality with a simple "hi" message
      // The agent command accepts stdin input
      const testResult = await $`printf "hi" | timeout ${Math.floor(timeouts.opencodeCli / 1000)} agent --model ${mappedModel}`;

      if (testResult.code !== 0) {
        const stderr = testResult.stderr?.toString() || '';

        if (stderr.includes('auth') || stderr.includes('login') || stderr.includes('API') || stderr.includes('key')) {
          await log('❌ Polza AI authentication failed', { level: 'error' });
          await log('   💡 Please check your POLZA_API_KEY environment variable', { level: 'error' });
          await log('   💡 Or set it in polza-config.json in your agent installation', { level: 'error' });
          return false;
        }

        await log(`❌ Polza AI validation failed with exit code ${testResult.code}`, { level: 'error' });
        if (stderr) await log(`   Error: ${stderr.trim()}`, { level: 'error' });
        return false;
      }

      // Success
      await log('✅ Polza AI connection validated successfully');
      return true;
    } catch (error) {
      await log(`❌ Failed to validate Polza AI connection: ${error.message}`, { level: 'error' });
      await log('   💡 Make sure @deep-assistant/agent is installed globally: bun install -g @deep-assistant/agent', { level: 'error' });
      return false;
    }
  };

  // Start the validation
  return await attemptValidation();
};

// Function to handle Polza AI runtime switching (if applicable)
export const handlePolzaRuntimeSwitch = async () => {
  // Polza is run as a CLI tool, runtime switching may not be applicable
  // This function can be used for any runtime-specific configurations if needed
  await log('ℹ️  Polza AI runtime handling not required for this operation');
};

// Main function to execute Polza AI with prompts and settings
export const executePolza = async (params) => {
  const {
    issueUrl,
    issueNumber,
    prNumber,
    prUrl,
    branchName,
    tempDir,
    isContinueMode,
    mergeStateStatus,
    forkedRepo,
    feedbackLines,
    forkActionsUrl,
    owner,
    repo,
    argv,
    log,
    formatAligned,
    getResourceSnapshot,
    polzaPath = 'agent',
    $
  } = params;

  // Import prompt building functions from polza.prompts.lib.mjs
  const { buildUserPrompt, buildSystemPrompt } = await import('./polza.prompts.lib.mjs');

  // Build the user prompt
  const prompt = buildUserPrompt({
    issueUrl,
    issueNumber,
    prNumber,
    prUrl,
    branchName,
    tempDir,
    isContinueMode,
    mergeStateStatus,
    forkedRepo,
    feedbackLines,
    forkActionsUrl,
    owner,
    repo,
    argv
  });

  // Build the system prompt
  const systemPrompt = buildSystemPrompt({
    owner,
    repo,
    issueNumber,
    prNumber,
    branchName,
    tempDir,
    isContinueMode,
    forkedRepo,
    argv
  });

  // Log prompt details in verbose mode
  if (argv.verbose) {
    await log('\n📝 Final prompt structure:', { verbose: true });
    await log(`   Characters: ${prompt.length}`, { verbose: true });
    await log(`   System prompt characters: ${systemPrompt.length}`, { verbose: true });
    if (feedbackLines && feedbackLines.length > 0) {
      await log('   Feedback info: Included', { verbose: true });
    }

    if (argv.dryRun) {
      await log('\n📋 User prompt content:', { verbose: true });
      await log('---BEGIN USER PROMPT---', { verbose: true });
      await log(prompt, { verbose: true });
      await log('---END USER PROMPT---', { verbose: true });
      await log('\n📋 System prompt content:', { verbose: true });
      await log('---BEGIN SYSTEM PROMPT---', { verbose: true });
      await log(systemPrompt, { verbose: true });
      await log('---END SYSTEM PROMPT---', { verbose: true });
    }
  }

  // Execute the Polza AI command
  return await executePolzaCommand({
    tempDir,
    branchName,
    prompt,
    systemPrompt,
    argv,
    log,
    formatAligned,
    getResourceSnapshot,
    forkedRepo,
    feedbackLines,
    polzaPath,
    $
  });
};

export const executePolzaCommand = async (params) => {
  const {
    tempDir,
    branchName,
    prompt,
    systemPrompt,
    argv,
    log,
    formatAligned,
    getResourceSnapshot,
    forkedRepo,
    feedbackLines,
    polzaPath,
    $
  } = params;

  // Retry configuration
  const maxRetries = 3;
  let retryCount = 0;

  const executeWithRetry = async () => {
    // Execute agent command from the cloned repository directory
    if (retryCount === 0) {
      await log(`\n${formatAligned('🤖', 'Executing Polza AI:', argv.model.toUpperCase())}`);
    } else {
      await log(`\n${formatAligned('🔄', 'Retry attempt:', `${retryCount}/${maxRetries}`)}`);
    }

    if (argv.verbose) {
      await log(`   Model: ${argv.model}`, { verbose: true });
      await log(`   Working directory: ${tempDir}`, { verbose: true });
      await log(`   Branch: ${branchName}`, { verbose: true });
      await log(`   Prompt length: ${prompt.length} chars`, { verbose: true });
      await log(`   System prompt length: ${systemPrompt.length} chars`, { verbose: true });
      if (feedbackLines && feedbackLines.length > 0) {
        await log(`   Feedback info included: Yes (${feedbackLines.length} lines)`, { verbose: true });
      } else {
        await log('   Feedback info included: No', { verbose: true });
      }
    }

    // Take resource snapshot before execution
    const resourcesBefore = await getResourceSnapshot();
    await log('📈 System resources before execution:', { verbose: true });
    await log(`   Memory: ${resourcesBefore.memory.split('\n')[1]}`, { verbose: true });
    await log(`   Load: ${resourcesBefore.load}`, { verbose: true });

    // Build Polza AI command
    let execCommand;

    // Map model alias to full ID
    const mappedModel = mapModelToId(argv.model);

    // Build agent command arguments
    let agentArgs = `--model ${mappedModel}`;

    if (argv.resume) {
      await log(`🔄 Resuming from session: ${argv.resume}`);
      // Note: Check if agent supports resume flag, add if it does
      agentArgs = `--model ${mappedModel}`;
      await log(`⚠️  Warning: Resume functionality may not be supported by Polza Agent`, { level: 'warning' });
    }

    // For Polza AI agent, we pass the combined prompt via stdin
    // We need to combine system and user prompts into a single message
    const combinedPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    // If there's a system prompt, we can use --append-system-message flag
    // Write the prompts to files for piping
    // Use OS temporary directory instead of repository workspace to avoid polluting the repo
    const promptFile = path.join(os.tmpdir(), `polza_prompt_${Date.now()}_${process.pid}.txt`);
    const systemPromptFile = systemPrompt ? path.join(os.tmpdir(), `polza_system_${Date.now()}_${process.pid}.txt`) : null;

    await fs.writeFile(promptFile, prompt);
    if (systemPromptFile) {
      await fs.writeFile(systemPromptFile, systemPrompt);
      agentArgs += ` --append-system-message-file ${systemPromptFile}`;
    }

    // Build the full command - pipe the prompt file to agent
    const fullCommand = `(cd "${tempDir}" && cat "${promptFile}" | ${polzaPath} ${agentArgs})`;

    await log(`\n${formatAligned('📝', 'Raw command:', '')}`);
    await log(`${fullCommand}`);
    await log('');

    try {
      // Pipe the prompt file to agent via stdin
      if (systemPromptFile) {
        execCommand = $({
          cwd: tempDir,
          mirror: false
        })`cat ${promptFile} | ${polzaPath} --model ${mappedModel} --append-system-message-file ${systemPromptFile}`;
      } else {
        execCommand = $({
          cwd: tempDir,
          mirror: false
        })`cat ${promptFile} | ${polzaPath} --model ${mappedModel}`;
      }

      await log(`${formatAligned('📋', 'Command details:', '')}`);
      await log(formatAligned('📂', 'Working directory:', tempDir, 2));
      await log(formatAligned('🌿', 'Branch:', branchName, 2));
      await log(formatAligned('🤖', 'Model:', `Polza AI ${argv.model.toUpperCase()}`, 2));
      if (argv.fork && forkedRepo) {
        await log(formatAligned('🍴', 'Fork:', forkedRepo, 2));
      }

      await log(`\n${formatAligned('▶️', 'Streaming output:', '')}\n`);

      let exitCode = 0;
      let sessionId = null;
      let limitReached = false;
      let limitResetTime = null;
      let lastMessage = '';

      for await (const chunk of execCommand.stream()) {
        if (chunk.type === 'stdout') {
          const output = chunk.data.toString();
          await log(output);
          lastMessage = output;
        }

        if (chunk.type === 'stderr') {
          const errorOutput = chunk.data.toString();
          if (errorOutput) {
            await log(errorOutput, { stream: 'stderr' });
          }
        } else if (chunk.type === 'exit') {
          exitCode = chunk.code;
        }
      }

      // Clean up temporary files
      try {
        await fs.unlink(promptFile);
        if (systemPromptFile) {
          await fs.unlink(systemPromptFile);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      if (exitCode !== 0) {
        // Check for usage limit errors first (more specific)
        const limitInfo = detectUsageLimit(lastMessage);
        if (limitInfo.isUsageLimit) {
          limitReached = true;
          limitResetTime = limitInfo.resetTime;

          // Format and display user-friendly message
          const messageLines = formatUsageLimitMessage({
            tool: 'Polza AI',
            resetTime: limitInfo.resetTime,
            sessionId,
            resumeCommand: sessionId ? `${process.argv[0]} ${process.argv[1]} ${argv.url} --resume ${sessionId}` : null
          });

          for (const line of messageLines) {
            await log(line, { level: 'warning' });
          }
        } else {
          await log(`\n\n❌ Polza AI command failed with exit code ${exitCode}`, { level: 'error' });
        }

        const resourcesAfter = await getResourceSnapshot();
        await log('\n📈 System resources after execution:', { verbose: true });
        await log(`   Memory: ${resourcesAfter.memory.split('\n')[1]}`, { verbose: true });
        await log(`   Load: ${resourcesAfter.load}`, { verbose: true });

        return {
          success: false,
          sessionId,
          limitReached,
          limitResetTime
        };
      }

      await log('\n\n✅ Polza AI command completed');

      return {
        success: true,
        sessionId,
        limitReached,
        limitResetTime
      };
    } catch (error) {
      reportError(error, {
        context: 'execute_polza',
        command: params.command,
        polzaPath: params.polzaPath,
        operation: 'run_polza_command'
      });

      await log(`\n\n❌ Error executing Polza AI command: ${error.message}`, { level: 'error' });
      return {
        success: false,
        sessionId: null,
        limitReached: false,
        limitResetTime: null
      };
    }
  };

  // Start the execution with retry logic
  return await executeWithRetry();
};

export const checkForUncommittedChanges = async (tempDir, owner, repo, branchName, $, log, autoCommit = false, autoRestartEnabled = true) => {
  // Similar to OpenCode version, check for uncommitted changes
  await log('\n🔍 Checking for uncommitted changes...');
  try {
    const gitStatusResult = await $({ cwd: tempDir })`git status --porcelain 2>&1`;

    if (gitStatusResult.code === 0) {
      const statusOutput = gitStatusResult.stdout.toString().trim();

      if (statusOutput) {
        await log('📝 Found uncommitted changes');
        await log('Changes:');
        for (const line of statusOutput.split('\n')) {
          await log(`   ${line}`);
        }

        if (autoCommit) {
          await log('💾 Auto-committing changes (--auto-commit-uncommitted-changes is enabled)...');

          const addResult = await $({ cwd: tempDir })`git add -A`;
          if (addResult.code === 0) {
            const commitMessage = 'Auto-commit: Changes made by Polza AI during problem-solving session';
            const commitResult = await $({ cwd: tempDir })`git commit -m ${commitMessage}`;

            if (commitResult.code === 0) {
              await log('✅ Changes committed successfully');

              const pushResult = await $({ cwd: tempDir })`git push origin ${branchName}`;

              if (pushResult.code === 0) {
                await log('✅ Changes pushed successfully');
              } else {
                await log(`⚠️ Warning: Could not push changes: ${pushResult.stderr?.toString().trim()}`, { level: 'warning' });
              }
            } else {
              await log(`⚠️ Warning: Could not commit changes: ${commitResult.stderr?.toString().trim()}`, { level: 'warning' });
            }
          } else {
            await log(`⚠️ Warning: Could not stage changes: ${addResult.stderr?.toString().trim()}`, { level: 'warning' });
          }
          return false;
        } else if (autoRestartEnabled) {
          await log('');
          await log('⚠️  IMPORTANT: Uncommitted changes detected!');
          await log('   Polza AI made changes that were not committed.');
          await log('');
          await log('🔄 AUTO-RESTART: Restarting Polza AI to handle uncommitted changes...');
          await log('   Polza AI will review the changes and decide what to commit.');
          await log('');
          return true;
        } else {
          await log('');
          await log('⚠️  Uncommitted changes detected but auto-restart is disabled.');
          await log('   Use --auto-restart-on-uncommitted-changes to enable or commit manually.');
          await log('');
          return false;
        }
      } else {
        await log('✅ No uncommitted changes found');
        return false;
      }
    } else {
      await log(`⚠️ Warning: Could not check git status: ${gitStatusResult.stderr?.toString().trim()}`, { level: 'warning' });
      return false;
    }
  } catch (gitError) {
    reportError(gitError, {
      context: 'check_uncommitted_changes_polza',
      tempDir,
      operation: 'git_status_check'
    });
    await log(`⚠️ Warning: Error checking for uncommitted changes: ${gitError.message}`, { level: 'warning' });
    return false;
  }
};

// Export all functions as default object too
export default {
  validatePolzaConnection,
  handlePolzaRuntimeSwitch,
  executePolza,
  executePolzaCommand,
  checkForUncommittedChanges,
  mapModelToId
};
