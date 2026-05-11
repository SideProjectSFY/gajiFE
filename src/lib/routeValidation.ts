const ID_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/;
const USERNAME_SEGMENT_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_-]{1,31}$/;

export function isValidIdSegment(value: string): boolean {
  return ID_SEGMENT_PATTERN.test(value);
}

export function isValidUsernameSegment(value: string): boolean {
  return USERNAME_SEGMENT_PATTERN.test(value);
}

