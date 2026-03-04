// Reexport the native module. On web, it will be resolved to SlowUsageStatsModule.web.ts
// and on native platforms to SlowUsageStatsModule.ts
export * from './src/SlowUsageStats.types';
export { default } from './src/SlowUsageStatsModule';

