# Lint Issues Tracker

This markdown file lists all current lint issues found in the project. As you address each issue, please mark it as **[x]** fixed. Unresolved issues remain as **[ ]**.

---

## DynamicPriceChart.tsx
- [x] **29:17** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`)

## NeuralNet.tsx
- [x] **46:68** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [x] **72:6** warning: React Hook useEffect has missing dependencies: 'generateNetworkVisualization' and 'loadPredictions'. Either include them or remove the dependency array (`react-hooks/exhaustive-deps`)
- [x] **135:6** warning: React Hook useEffect has a missing dependency: 'animateNeuralNetwork'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`)
- [x] **139:6** warning: React Hook useEffect has a missing dependency: 'generateNetworkVisualization'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`)
- [ ] **296:23** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [x] **452:66** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)

> **Note:** All type/property errors related to `PendingPrediction` and completedPredictions UI are resolved as of 2025-04-17.

## NeuralNetHistory.tsx
- [x] **20:6** warning: React Hook useEffect has a missing dependency: 'loadModels'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`)

## PayPalCheckout.tsx
- [x] **13:21** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [x] **57:38** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)

## Predictions.tsx
- [x] Module not found: `lucide-react` (Fixed: Installed lucide-react)
- [x] Namespace 'global.NodeJS' has no exported member 'Timeout'. (Fixed: Installed @types/node, use `ReturnType<typeof setTimeout>` for type safety)
- [x] **341:6** warning: React Hook useEffect has a missing dependency: 'loadPredictions'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: Dependency array is correct, only loadPredictions is referenced)
- [x] **357:6** warning: React Hook useEffect has a missing dependency: 'generatePrediction'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: generatePrediction added to dependency array, now correct)
- [x] **443:78** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: Added explicit types to prediction and tickValues in generatePrediction)
- [x] **463:6** warning: React Hook useCallback has a missing dependency: 'handleAddPrediction'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: handleAddPrediction added to dependency array of generatePrediction)

> Note: Use `ReturnType<typeof setTimeout>` instead of `NodeJS.Timeout` for best cross-env type safety.


## ProSubscription.tsx
- [x] **29:48** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: Explicit PayPalDetails interface used for parameter type) 
- [x] **86:34** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: Explicit PayPalApproveData interface used for parameter type) 

## Terminal.tsx
- [x] **30:1** error: Type '({ onClose, onMinimize, onMaximize }: TerminalProps) => void' is not assignable to type 'FC<TerminalProps>'. Type 'void' is not assignable to type 'ReactNode'. (Fixed: Function now always returns JSX.Element, 2025-04-17)
- [x] **296:1** error: Type 'Element' is not assignable to type 'string'. (Fixed: history is always string[], processCommand structure fixed, 2025-04-17)
- [x] **485:2** error: '}' expected. (Fixed: Braces and structure corrected, no missing/extra braces, 2025-04-17)
> All JSX, type, and structure issues in Terminal.tsx are resolved as of 2025-04-17.

## Training.tsx
- [x] **303:9** warning: The 'levelThresholds' array makes the dependencies of useEffect Hook (at line 364) change on every render. To fix this, wrap the initialization of 'levelThresholds' in its own useMemo() Hook (`react-hooks/exhaustive-deps`) (Fixed: Wrapped in useMemo)
- [x] **Redeclaration/stray code errors**: Duplicate completeMission and orphaned code blocks removed (2025-04-17). File is ready for further linting.
- [x] **449:6** warning: React Hook useEffect has a missing dependency: 'completeMission'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: completeMission included in dependency array, 2025-04-17)

## UpdatedAdminPanel.tsx
- [x] **67:38** error: 'userError' is never reassigned. Use 'const' instead (`prefer-const`) (Fixed: destructured as const, fallback values use let, 2025-04-17)
- [x] **82:40** error: 'tradesError' is never reassigned. Use 'const' instead (`prefer-const`) (Fixed: destructured as const, fallback values use let, 2025-04-17)
- [x] **95:40** error: 'epochsError' is never reassigned. Use 'const' instead (`prefer-const`) (Fixed: destructured as const, fallback values use let, 2025-04-17)

## WebSocketDebug.tsx
- [x] **16:57** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: Replaced with explicit WebSocketMessage type, 2025-04-17)
- [x] **24:34** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: Replaced with Record<string, unknown>, 2025-04-17)
- [x] **102:35** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: All message/tick types now explicit, 2025-04-17)

## ui/badge.tsx
- [x] **41:17** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: badgeVariants and types moved to badgeUtils.ts, 2025-04-17)

## ui/button.tsx
- [x] **56:18** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: buttonVariants and types moved to buttonUtils.ts, 2025-04-17)

## ui/command.tsx
- [x] **24:11** error: An interface declaring no members is equivalent to its supertype (`@typescript-eslint/no-empty-object-type`) (Fixed: removed empty interface, DialogProps used directly, 2025-04-17)

## ui/form.tsx
- [x] **168:3** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: useFormField moved out, only components exported, 2025-04-17)

## ui/navigation-menu.tsx
- [x] **119:3** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: navigationMenuTriggerStyle moved out, only components exported, 2025-04-17)

## ui/sidebar.tsx
- [x] **760:3** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: only components exported, shared logic to sidebarUtils.ts if needed, 2025-04-17)

## ui/sonner.tsx
- [x] **32:10** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: only components exported, shared logic to sonnerUtils.ts if needed, 2025-04-17)

## Index.tsx
- [x] Fixed: Terminal import changed to default import. Confirmed useAuth is correctly imported as a named export from AuthContext.tsx.
- [x] **56:6** warning: React Hook useEffect has a missing dependency: 'updateUserLoginTime'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: updateUserLoginTime wrapped in useCallback and included as dependency, 2025-04-17)

## ui/textarea.tsx
- [x] **6:18** error: An interface declaring no members is equivalent to its supertype (`@typescript-eslint/no-empty-object-type`) (Fixed: removed empty interface, props typed directly, 2025-04-17)

## ui/theme-provider.tsx
- [x] **12:10** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: only components exported, shared logic to themeProviderUtils.ts if needed, 2025-04-17)

## ui/toggle.tsx
- [x] **43:18** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: toggleVariants and types moved to toggleUtils.ts, only components exported, 2025-04-17)

## AuthContext.tsx
- [x] **13:65** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with unknown, 2025-04-17)
- [x] **14:83** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with unknown, 2025-04-17)
- [x] **58:6** warning: React Hook useEffect has a missing dependency: 'fetchUserDetails'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: fetchUserDetails moved above useEffect and added to deps, 2025-04-17)
- [x] **179:28** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with Record<string, unknown>, 2025-04-17)
- [x] **224:14** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: only components exported, 2025-04-17)

All AuthContext.tsx lint issues fixed: explicit types, dependency array, and correct FC return.

## usePersistentWebSocket.ts
- [x] **10:22** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with Record<string, unknown>, 2025-04-17)
- [x] **13:21** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with unknown, 2025-04-17)
- [x] **58:34** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with Record<string, unknown>, 2025-04-17)
- [x] **75:33** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with unknown, 2025-04-17)
- [x] **133:35** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`) (Fixed: replaced with (...args: unknown[]) => void, 2025-04-17)
- [x] **134:36** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`) (Fixed: replaced with (...args: unknown[]) => void, 2025-04-17)

## usePredictions.ts
- [x] **30:9** warning: The 'predictionModes' object makes the dependencies of useCallback Hook (at line 142) change on every render. To fix this, wrap the initialization of 'predictionModes' in its own useMemo() Hook (`react-hooks/exhaustive-deps`) (Fixed: predictionModes is now memoized with useMemo, 2025-04-17)

## useSettings.tsx
- [x] **23:14** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: DEFAULT_SETTINGS moved to settingsUtils.ts, only components/hooks exported, 2025-04-17)
- [x] **159:14** warning: Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components (`react-refresh/only-export-components`) (Fixed: DEFAULT_SETTINGS moved to settingsUtils.ts, only components/hooks exported, 2025-04-17)

## neuralNetwork.ts
- [x] **448:79** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with unknown[], 2025-04-17)

## utils.ts
- [x] **10:34** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`) (Fixed: replaced with (...args: unknown[]) => void, 2025-04-17)
- [x] **12:31** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`) (Fixed: replaced with (...args: unknown[]) => void, 2025-04-17)
- [x] **19:32** error: The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type (`@typescript-eslint/no-unsafe-function-type`) (Fixed: replaced with (...args: unknown[]) => void, 2025-04-17)
- [x] **24:32** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`) (Fixed: replaced with unknown[], 2025-04-17)

## Index.tsx
- [x] **56:6** warning: React Hook useEffect has a missing dependency: 'updateUserLoginTime'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`) (Fixed: updateUserLoginTime wrapped in useCallback and included as dependency, 2025-04-17)

## Login.tsx
- [ ] **43:21** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **89:21** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **116:21** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **142:21** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)

## Splash.tsx
- [ ] **39:6** warning: React Hook useEffect has a missing dependency: 'icons.length'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`)
- [ ] **61:6** warning: React Hook useEffect has a missing dependency: 'messages'. Either include it or remove the dependency array (`react-hooks/exhaustive-deps`)

## EpochService.ts
- [ ] **24:32** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **313:26** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)

## PredictionService.ts
- [ ] **20:16** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)

## TrainingService.ts
- [ ] **11:10** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **31:15** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **40:15** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **51:15** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **99:77** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **126:17** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **352:12** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **356:18** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)
- [ ] **428:49** error: Unexpected any. Specify a different type (`@typescript-eslint/no-explicit-any`)

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

> As you fix each issue, change `[ ]` to `[x]` to track your progress.
