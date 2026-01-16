/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from './theme.js';
import { darkSemanticColors } from './semantic-tokens.js';

const catppuccinMochaColors: ColorsTheme = {
  type: 'dark',
  Background: '#1e1e2e', // Base
  Foreground: '#cdd6f4', // Text
  LightBlue: '#89dceb', // Sky
  AccentBlue: '#89b4fa', // Blue
  AccentPurple: '#cba6f7', // Mauve
  AccentCyan: '#74c7ec', // Sapphire
  AccentGreen: '#a6e3a1', // Green
  AccentYellow: '#f9e2af', // Yellow
  AccentRed: '#f38ba8', // Red
  DiffAdded: 'rgba(166, 227, 161, 0.3)', // Transparent green for diff add
  DiffRemoved: 'rgba(243, 139, 168, 0.3)', // Transparent red for diff remove
  Comment: '#6c7086', // Overlay
  Gray: '#7f849c', // Subtext1
  GradientColors: ['#89b4fa', '#cba6f7', '#a6e3a1'],
};

export const CatppuccinMocha: Theme = new Theme(
  'Catppuccin Mocha',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: catppuccinMochaColors.Background,
      color: catppuccinMochaColors.Foreground,
    },
    'hljs-keyword': {
      color: catppuccinMochaColors.AccentPurple,
    },
    'hljs-literal': {
      color: catppuccinMochaColors.AccentPurple,
    },
    'hljs-symbol': {
      color: catppuccinMochaColors.AccentCyan,
    },
    'hljs-name': {
      color: catppuccinMochaColors.LightBlue,
    },
    'hljs-link': {
      color: catppuccinMochaColors.AccentBlue,
    },
    'hljs-function .hljs-keyword': {
      color: catppuccinMochaColors.AccentYellow,
    },
    'hljs-subst': {
      color: catppuccinMochaColors.Foreground,
    },
    'hljs-string': {
      color: catppuccinMochaColors.AccentGreen,
    },
    'hljs-title': {
      color: catppuccinMochaColors.AccentYellow,
    },
    'hljs-type': {
      color: catppuccinMochaColors.AccentBlue,
    },
    'hljs-attribute': {
      color: catppuccinMochaColors.AccentYellow,
    },
    'hljs-bullet': {
      color: catppuccinMochaColors.AccentYellow,
    },
    'hljs-addition': {
      color: catppuccinMochaColors.AccentGreen,
    },
    'hljs-variable': {
      color: catppuccinMochaColors.Foreground,
    },
    'hljs-template-tag': {
      color: catppuccinMochaColors.AccentYellow,
    },
    'hljs-template-variable': {
      color: catppuccinMochaColors.AccentYellow,
    },
    'hljs-comment': {
      color: catppuccinMochaColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: catppuccinMochaColors.AccentCyan,
      fontStyle: 'italic',
    },
    'hljs-deletion': {
      color: catppuccinMochaColors.AccentRed,
    },
    'hljs-meta': {
      color: catppuccinMochaColors.AccentYellow,
    },
    'hljs-doctag': {
      fontWeight: 'bold',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
  },
  catppuccinMochaColors,
  darkSemanticColors,
);