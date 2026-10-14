import { ISSUE_CATEGORIES, MAX_PHOTO_SIZE_BYTES } from '../constants/civicConstants';
import { IssueCategory } from '../types/civic';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Sanitizes input string to prevent stored/reflected XSS and control characters.
 */
export function sanitizeText(input: string, maxLength = 2000): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip javascript protocol
    .replace(/on\w+=/gi, '') // Strip inline event handlers
    .slice(0, maxLength);
}

/**
 * Validates geographic coordinate bounds.
 */
export function validateCoordinates(lat?: number, lng?: number): { isValid: boolean; error?: string } {
  if (lat === undefined || lng === undefined) {
    return { isValid: false, error: 'Coordinates are required for geospatial location.' };
  }
  if (isNaN(lat) || isNaN(lng)) {
    return { isValid: false, error: 'Coordinates must be valid numeric values.' };
  }
  if (lat < -90 || lat > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and +90 degrees.' };
  }
  if (lng < -180 || lng > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and +180 degrees.' };
  }
  return { isValid: true };
}

/**
 * Validates report creation input before submission.
 */
export function validateReportInput(data: {
  category: string;
  description: string;
  photoUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.category || !ISSUE_CATEGORIES.includes(data.category as IssueCategory)) {
    errors.category = 'Please select a valid municipal issue category.';
  }

  const cleanDesc = sanitizeText(data.description || '');
  if (!cleanDesc || cleanDesc.length < 10) {
    errors.description = 'Please provide a descriptive explanation (minimum 10 characters).';
  } else if (cleanDesc.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters.';
  }

  if (!data.photoUrl || !data.photoUrl.trim()) {
    errors.photo = 'A photographic record is required for municipal verification.';
  }

  if (!data.address || !data.address.trim()) {
    errors.address = 'Street address or location description is required.';
  }

  const coordCheck = validateCoordinates(data.latitude, data.longitude);
  if (!coordCheck.isValid && coordCheck.error) {
    errors.coordinates = coordCheck.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates an uploaded image file on the client.
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedMimeTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Unsupported image format. Please select a JPEG, PNG, or WebP photo.',
    };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Image size exceeds the 10MB limit (selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  return { isValid: true };
}
