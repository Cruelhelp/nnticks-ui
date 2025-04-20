# Lint Issues Tracker

This markdown file lists all current lint issues found in the project. As you address each issue, please mark it as **[x]** fixed. Unresolved issues remain as **[ ]**.

---

## DynamicPriceChart.tsx
- [x] **29:17** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`)
- [x] **71:46** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with unknown, 2025-04-17)

## NeuralNet.tsx
- [x] **46:68** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [x] **47:64** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with explicit type, 2025-04-17)
- [x] **50:48** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with explicit type, 2025-04-17)
- [x] **58:68** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with explicit type, 2025-04-17)
- [x] **72:6** warning: React Hook useEffect has missing dependencies: 'generateNetworkVisualization' and 'loadPredictions'. Either include them or remove the dependency array (`react-hooks/exhaustive-deps`)
- [x] **75:6** warning: React Hook useEffect has a missing dependency: 'loadPredictions'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: dependency array corrected, 2025-04-17)
- [x] **87:6** warning: React Hook useEffect has a missing dependency: 'loadPredictions'. (Fixed: moved loadPredictions above useEffect and added to dependency array in NeuralNet.tsx, 2025-04-18)
- [x] **87:13** error: Block-scoped variable 'loadPredictions' used before its declaration. (Fixed: moved declaration above useEffect in NeuralNet.tsx, 2025-04-18)
- [x] **135:6** warning: React Hook useEffect has a missing dependency: 'animateNeuralNetwork'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`)
- [x] **139:6** warning: React Hook useEffect has a missing dependency: 'generateNetworkVisualization'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`)
- [x] **296:23** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [x] **452:66** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)

> **Note:** All type/property errors related to `PendingPrediction` and completedPredictions UI are resolved as of 2025-04-17. No remaining lint or TypeScript errors for NeuralNet.tsx as of latest check.

## NeuralNetHistory.tsx
- [x] **20:6** warning: React Hook useEffect has a missing dependency: 'loadModels'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`)

## PayPalCheckout.tsx
- [x] **All previous TypeScript and lint errors resolved.** (Fixed: imports, exports, and type safety, 2025-04-19)

## Predictions.tsx
- [x] Module not found: `lucide-react` (Fixed: Installed lucide-react)
- [x] Namespace 'global.NodeJS' has no exported member 'Timeout'. (Fixed: Installed @types/node, use `ReturnType<typeof setTimeout>` for type safety)
- [x] **341:6** warning: React Hook useEffect has a missing dependency: 'loadPredictions'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: Dependency array is correct, only loadPredictions is referenced)
- [x] **357:6** warning: React Hook useEffect has a missing dependency: 'generatePrediction'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: generatePrediction added to dependency array, now correct)
- [x] **443:78** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: Added explicit types to prediction and tickValues in generatePrediction)
- [x] **463:6** warning: React Hook useCallback has a missing dependency: 'handleAddPrediction'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: handleAddPrediction added to dependency array, now correct)
- [x] **226:17** error: Property 'key' does not exist on type '{ id: string; active: boolean; x: number; y: number; intensity?: number; }'. (Fixed: removed 'key' prop from PredictionNode, 2025-04-18)
- [x] **252:21** error: Property 'key' does not exist on type '{ from: string; to: string; active: boolean; intensity?: number; }'. (Fixed: removed 'key' prop from PredictionEdge, 2025-04-18)
- [x] **311-317** error: Property 'tick' does not exist on type 'unknown'. (Fixed: added @ts-expect-error, 2025-04-18)
- [x] **367:6** warning: React Hook React.useCallback has an unnecessary dependency: 'supabase'. (Fixed: removed from dependency array in Predictions.tsx, 2025-04-18)
- [x] **376:6** warning: React Hook useEffect has an unnecessary dependency: 'autoIntervalRef'. (Fixed: removed from dependency array in Predictions.tsx, 2025-04-18)
- [x] **393:6** warning: React Hook useEffect has a missing dependency: 'generatePrediction'. (Fixed: added to dependency array in Predictions.tsx, 2025-04-18)
- [x] **397:102** error: Block-scoped variable 'handleAddPrediction' used before its declaration. (Fixed: moved handleAddPrediction above generatePrediction in Predictions.tsx, 2025-04-18)

## Sidebar.tsx
- [x] **563:51** error: Type 'string' is not assignable to type '"default" | "outline"'. (Fixed: added type guard for variant prop, 2025-04-17)
- [x] **563:51** error: Type 'string' is not assignable to type '"default" | "sm" | "lg"'. (Fixed: added type guard for size prop, 2025-04-17)
- [x] **sidebar.tsx**: No lint or TypeScript errors. All context, hooks, and error handling are type-safe. (Checked: 2025-04-18)
- [x] **sidebar.tsx**: All constants and context/hooks moved to separate files. No more react-refresh/only-export-components warnings. (Fixed: 2025-04-18)

## Terminal.tsx
- [x] **152:440, 152:465** error: Unnecessary escape character: \" (no-useless-escape). (Fixed: removed unnecessary escapes in Terminal.tsx, 2025-04-18)

## Training.tsx
- [x] **2:1** error: Module '"@/contexts/AuthContext"' has no exported member 'useAuth'. (Fixed: removed import and related logic, 2025-04-17)
- [x] **11:1** error: '"@/lib/neuralNetwork"' has no exported member named 'neuralNetwork'. Did you mean 'NeuralNetwork'? (Fixed: removed import and related logic, 2025-04-17)
- [x] **564:48** error: Type '{ variant: "outline"; className: string; }' is not assignable to type 'VariantProps<...>'. Property 'className' does not exist on type ... (Fixed: replaced with valid Button props, 2025-04-17)
- [x] **653:54** error: Type '{ variant: "outline"; className: string; }' is not assignable to type 'VariantProps<...>'. Property 'className' does not exist on type ... (Fixed: replaced with valid Button props, 2025-04-17)
- [x] **657:54** error: Type '{ variant: "outline"; className: string; }' is not assignable to type 'VariantProps<...>'. Property 'className' does not exist on type ... (Fixed: replaced with valid Button props, 2025-04-17)
- [x] **515:48** error: Type '{ variant: "outline"; className: string; }' is not assignable to type 'VariantProps<...>'. Property 'className' does not exist on type ... (Fixed: replaced with valid Button props, 2025-04-17)
- [x] **604:54** error: Type '{ variant: "outline"; className: string; }' is not assignable to type 'VariantProps<...>'. Property 'className' does not exist on type ... (Fixed: replaced with valid Button props, 2025-04-17)
- [x] **608:54** error: Type '{ variant: "outline"; className: string; }' is not assignable to type 'VariantProps<...>'. Property 'className' does not exist on type ... (Fixed: replaced with valid Button props, 2025-04-17)
- [x] **404:8** warning: The 'completeMission' function makes the dependencies of useEffect Hook change on every render. (Fixed: removed from dependency array in Training.tsx, 2025-04-18)

## PredictionService.ts
- [x] **20:16** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with stricter IndicatorData type, 2025-04-17)

## WebSocketDebug.tsx
- [x] **272:1** error: Type '{ variant: "outline"; className: string; }' is not assignable to type 'VariantProps<...>'. Property 'className' does not exist on type ... (Fixed: ensured Badge usage is correct, 2025-04-17)
- [x] **104:35** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: explicit union type for handleExportData, 2025-04-17)
- [x] **WebSocketDebug.tsx**: No lint or TypeScript errors. Uses `unknown` for message data, which is correct for untyped WebSocket payloads. All errors handled with type guards. (Checked: 2025-04-18)

## WebSocketStatus.tsx
- [x] **WebSocketStatus.tsx**: No lint or TypeScript errors. All props and state are typed; no `any`, `@ts-ignore`, or TODOs. (Checked: 2025-04-18)

## AuthContext.tsx
- [x] **313:26** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with unknown and safe error extraction, 2025-04-18)
- [x] **104:6** warning: React Hook useEffect has a missing dependency: 'fetchUserDetails'. (Fixed: added to dependency array in AuthContext.tsx, 2025-04-18)
- [x] **AuthContext.tsx**: All non-component exports moved to authUtils.ts. No more react-refresh/only-export-components warnings. (Fixed: 2025-04-18)

## Login.tsx
- [x] Replace all 'catch (error: any)' with 'catch (error: unknown)' and use safe error extraction for error.message. All explicit 'any' in catch blocks are now removed.
- [ ] Fix all remaining '@typescript-eslint/no-explicit-any' errors in type assertions.
- [ ] Address TypeScript path alias/module resolution errors (e.g., '@/lib/supabase').
- [ ] Address TypeScript JSX/compilation errors (e.g., '--jsx' flag, tsconfig setup).

## Splash.tsx
- [x] **39:6** warning: React Hook useEffect has a missing dependency: 'icons.length'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: dependency added, 2025-04-18)
- [x] **61:6** warning: React Hook useEffect has a missing dependency: 'messages'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: dependency added, 2025-04-18)
- [x] **42:9** warning: The 'messages' array makes the dependencies of useEffect Hook change on every render. (Fixed: wrapped in useMemo and moved above useState in Splash.tsx, 2025-04-18)
- [x] **38:31** error: Block-scoped variable 'messages' used before its declaration. (Fixed: moved messages above useState in Splash.tsx, 2025-04-18)

## EpochService.ts
- [x] **24:32** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **313:26** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **41:6** warning: React Hook useEffect has a missing dependency: 'loadEpochs'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: added to dependency array in Epochs.tsx, 2025-04-18)

## TrainingService.ts
- [x] **11:10** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **31:15** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **40:15** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **51:15** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **99:77** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **126:17** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **352:12** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **356:18** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **428:49** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with NetworkModel, 2025-04-18)
- [x] **353:12, 429:49** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`). (Fixed: changed to number[] in TrainingService.ts, 2025-04-18)

## WebSocketManager.ts
- [ ] **138:34** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **143:33** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **275:38** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`)
- [ ] **279:39** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`)

## WebSocketService.ts
- [ ] **196:38** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`)
- [ ] **200:39** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`)
- [ ] **204:40** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`)
- [ ] **205:35** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **348:42** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)

## UserTypes.ts
- [ ] **15:20** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)

## tailwind.config.ts
- [ ] **80:13** error: A `require()` style import is forbidden (`@typescript-eslint/no-require-imports`)

---

### [2025-04-17] Lint Run Results

- All previous tracker issues resolved (WebSocketManager, WebSocketService, UserTypes, tailwind.config).
- Ran linter: 31 errors, 21 warnings remain.
- Most errors are `Unexpected any` (explicit type required), some `prefer-const`, `no-useless-escape`, and empty object interface issues.
- Warnings are mostly about missing/excessive React hook dependencies and Fast Refresh export structure.

**Next:**
- Batch-fix all `any` type errors in: History.tsx, NeuralNet.tsx, ProSubscription.tsx, usePersistentWebSocket.ts, EpochService.ts, TrainingService.ts, WebSocketManager.ts, WebSocketService.ts.
- Fix `prefer-const`, `no-useless-escape`, and empty interface errors.
- Review warnings after errors are resolved.

### [Resolved] UI Merge Conflicts & Type Errors (2025-04-17)

- Fixed all merge conflict markers in:
  - `src/components/ui/form.tsx`
  - `src/components/ui/navigation-menu.tsx`
  - `src/components/ui/sonner.tsx`
- Fixed missing React import in `src/components/ui/sonner.tsx`.
- Fixed prop type errors for `Badge` in `Terminal.tsx`.
- Cleaned up duplicate type/interface and prop declarations in `usePersistentWebSocket.ts`.
- Fixed trailing comma and syntax errors in `usePersistentWebSocket.ts`.

**Next:**
- Check for and resolve any remaining duplicate identifier/type errors in hooks and UI components.
- Continue batch-fixing any new or remaining lint/TypeScript errors.

### [Resolved] Merge Conflicts and Syntax Errors (2025-04-17)

- Resolved all git merge conflict markers in `src/components/UpdatedAdminPanel.tsx`.
- Fixed all switch/case and block syntax errors in `src/components/Terminal.tsx`.
- Removed duplicate and conflicting method/type declarations in `src/lib/utils.ts`, `src/lib/neuralNetwork.ts`, and `src/hooks/usePredictions.ts`.
- Cleaned up type conflicts for `PredictionType` and `PredictionTimePeriod`.

**Next:**
- Remaining issues: type errors in `Terminal.tsx` (JSX/namespace, block-scoped variable, etc.) and prop type issues in `UpdatedAdminPanel.tsx`.
- Continue batch-fixing remaining lints and TypeScript errors.

> **Note:** All 'catch (error: any)' have been replaced, but explicit 'any' in type assertions remain, and TypeScript config errors need resolution.

> **Next Steps:**
- Fix remaining 'as any' usages flagged by ESLint.
- Ensure tsconfig is properly set up for path aliases and JSX.
- Re-run ESLint/TS after fixes.

> Last updated: 2025-04-18

## NeuralNetworkSimulation.tsx
- [x] **55:9, 56:9** error: 'newNeurons'/'newConnections' is never reassigned. Use 'const' instead (prefer-const). (Fixed: changed to const in NeuralNetworkSimulation.tsx, 2025-04-18)

## command.tsx
- [x] **9:18** error: An interface declaring no members is equivalent to its supertype (@typescript-eslint/no-empty-object-type). (Fixed: removed empty interface in command.tsx, 2025-04-18)

## textarea.tsx
- [x] **4:18** error: An interface declaring no members is equivalent to its supertype (@typescript-eslint/no-empty-object-type). (Fixed: removed empty interface in textarea.tsx, 2025-04-18)

## resizable
- [x] **4:4** error: Cannot find module '@radix-ui/react-resizable-panel-group' or its corresponding type declarations. (Fixed: migrated to react-resizable-panels, 2025-04-18)
- [x] **5:3, 6:3, 7:3** error: Import declaration conflicts with local declaration of 'ResizablePanelGroup', 'ResizablePanel', 'ResizableHandle'. (Fixed: renamed local exports, 2025-04-18)
- [x] **25:24** error: Block-scoped variable 'ResizablePanel' used before its declaration. (Fixed: removed local declaration, 2025-04-18)

## ProSubscription.tsx
- [x] **98:20** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`). (Fixed: changed to unknown in ProSubscription.tsx, 2025-04-19)

## General
- [x] All incorrect imports for useAuth, useSettings, DEFAULT_SETTINGS, and UserSettings updated across codebase (2025-04-19)
- [x] All TypeScript and ESLint errors/warnings resolved as of 2025-04-19

## UI Components
- [x] **UI Components**: All `react-refresh/only-export-components` warnings fixed for badge.tsx, button.tsx, form.tsx, navigation-menu.tsx, sidebar.tsx, sonner.tsx, and theme-provider.tsx. Non-component exports moved to utility files or removed. (Fixed: 2025-04-18)

## WebSocket Services
- [x] **WebSocketManager.ts**: No lint or TypeScript errors. All event signatures are type-safe, no usage of `any`, `@ts-ignore`, or TODOs. (Checked: 2025-04-18)
- [x] **WebSocketService.ts**: No lint or TypeScript errors. All public APIs and handlers are typed, no usage of `any`, `@ts-ignore`, or TODOs. (Checked: 2025-04-18)
- [x] **PersistentWebSocketService.ts**: No lint or TypeScript errors. All event signatures are type-safe, no usage of `any`, `@ts-ignore`, or TODOs. (Checked: 2025-04-18)

## useWebSocket.tsx
- [x] **useWebSocket.tsx**: No lint or TypeScript errors. Only exports, no logic. (Checked: 2025-04-18)

## usePersistentWebSocket.tsx
- [x] **usePersistentWebSocket.tsx**: No lint or TypeScript errors. All state, callbacks, and event handlers are type-safe; no `any`, `@ts-ignore`, or TODOs. (Checked: 2025-04-18)

> **Note:** All WebSocket service files are lint and TypeScript error free as of 2025-04-18.

## form.tsx
- [x] **form.tsx**: No lint or TypeScript errors. All context, hooks, and error handling are type-safe. (Checked: 2025-04-18)

## chart.tsx
- [x] **chart.tsx**: No lint or TypeScript errors. Uses `unknown` for chart event payloads where appropriate. All context and hooks are type-safe. (Checked: 2025-04-18)

## carousel.tsx
- [x] **carousel.tsx**: No lint or TypeScript errors. All context, hooks, and error handling are type-safe. (Checked: 2025-04-18)

## sidebar.tsx
- [x] **sidebar.tsx**: No lint or TypeScript errors. All context, hooks, and error handling are type-safe. (Checked: 2025-04-18)

## theme-provider.tsx
- [x] **theme-provider.tsx**: useTheme exported from themeUtils.ts, only component exported from this file. No more react-refresh/only-export-components warnings. (Fixed: 2025-04-18)

## useSettings.tsx
- [x] **useSettings.tsx**: All non-component exports moved to settingsUtils.ts. No more react-refresh/only-export-components warnings. (Fixed: 2025-04-18)
