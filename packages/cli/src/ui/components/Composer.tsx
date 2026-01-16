/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, useIsScreenReaderEnabled } from 'ink';
import { useMemo } from 'react';
import { LoadingIndicator } from './LoadingIndicator.js';

import { DetailedMessagesDisplay } from './DetailedMessagesDisplay.js';
import { InputPrompt, calculatePromptWidths } from './InputPrompt.js';
import { Footer } from './Footer.js';
import { ShowMoreLines } from './ShowMoreLines.js';
import { QueuedMessageDisplay } from './QueuedMessageDisplay.js';
import { OverflowProvider } from '../contexts/OverflowContext.js';
// import { theme } from '../semantic-colors.js';
// import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useUIActions } from '../contexts/UIActionsContext.js';
import { useVimMode } from '../contexts/VimModeContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
// import { ApprovalMode } from '@qwen-code/qwen-code-core';
import { StreamingState } from '../types.js';
import { ConfigInitDisplay } from '../components/ConfigInitDisplay.js';
import { t } from '../../i18n/index.js';

export const Composer = () => {
  const config = useConfig();
  const settings = useSettings();
  const isScreenReaderEnabled = useIsScreenReaderEnabled();
  const uiState = useUIState();
  const uiActions = useUIActions();
  const { vimEnabled } = useVimMode();
  const terminalWidth = process.stdout.columns;
  // const isNarrow = isNarrowWidth(terminalWidth);
  const debugConsoleMaxHeight = Math.floor(Math.max(terminalWidth * 0.2, 5));

  const { showAutoAcceptIndicator } = uiState;

  // Use the container width of InputPrompt for width of DetailedMessagesDisplay
  const { containerWidth } = useMemo(
    () => calculatePromptWidths(uiState.terminalWidth),
    [uiState.terminalWidth],
  );

  return (
    <Box flexDirection="column">
      {!uiState.embeddedShellFocused && (
        <LoadingIndicator
          thought={
            uiState.streamingState === StreamingState.WaitingForConfirmation ||
            config.getAccessibility()?.disableLoadingPhrases
              ? undefined
              : uiState.thought
          }
          currentLoadingPhrase={
            config.getAccessibility()?.disableLoadingPhrases
              ? undefined
              : uiState.currentLoadingPhrase
          }
          elapsedTime={uiState.elapsedTime}
        />
      )}

      {!uiState.isConfigInitialized && <ConfigInitDisplay />}

      <QueuedMessageDisplay messageQueue={uiState.messageQueue} />

      {uiState.showErrorDetails && (
        <OverflowProvider>
          <Box flexDirection="column">
            <DetailedMessagesDisplay
              messages={uiState.filteredConsoleMessages}
              maxHeight={
                uiState.constrainHeight ? debugConsoleMaxHeight : undefined
              }
              width={containerWidth}
            />
            <ShowMoreLines constrainHeight={uiState.constrainHeight} />
          </Box>
        </OverflowProvider>
      )}

      {uiState.isInputActive && (
        <InputPrompt
          buffer={uiState.buffer}
          inputWidth={uiState.inputWidth}
          suggestionsWidth={uiState.suggestionsWidth}
          onSubmit={uiActions.handleFinalSubmit}
          userMessages={uiState.userMessages}
          onClearScreen={uiActions.handleClearScreen}
          config={config}
          slashCommands={uiState.slashCommands}
          commandContext={uiState.commandContext}
          shellModeActive={uiState.shellModeActive}
          setShellModeActive={uiActions.setShellModeActive}
          approvalMode={showAutoAcceptIndicator}
          onEscapePromptChange={uiActions.onEscapePromptChange}
          focus={true}
          vimHandleInput={uiActions.vimHandleInput}
          isEmbeddedShellFocused={uiState.embeddedShellFocused}
          placeholder={
            vimEnabled ? '  ' + t('') : '  ' + t('no excusess, only weakness')
          }
        />
      )}

      {!settings.merged.ui?.hideFooter && !isScreenReaderEnabled && <Footer />}
    </Box>
  );
};
