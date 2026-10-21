import {
  PROJECT_MEMORY_KINDS,
  PROJECT_MEMORY_SOURCE_TYPES,
  PROJECT_MEMORY_STATUSES,
  ProjectMemoryKind,
  ProjectMemorySourceType,
  ProjectMemoryStatus,
} from '@local-ai/constants';

const isValidMemoryKind = (value: string): value is ProjectMemoryKind =>
  (PROJECT_MEMORY_KINDS as readonly string[]).includes(value);

const isValidSourceType = (value: string): value is ProjectMemorySourceType =>
  (PROJECT_MEMORY_SOURCE_TYPES as readonly string[]).includes(value);

const isValidMemoryStatus = (value: string): value is ProjectMemoryStatus =>
  (PROJECT_MEMORY_STATUSES as readonly string[]).includes(value);

export { isValidMemoryKind, isValidMemoryStatus, isValidSourceType };
