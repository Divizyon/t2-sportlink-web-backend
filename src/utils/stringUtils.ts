/**
 * Utility functions for string operations
 */

/**
 * Generates a slug from a string
 * Converts a string to lowercase, replaces spaces with hyphens
 * and removes special characters
 * 
 * @param text Input text to convert to a slug
 * @returns Generated slug
 */
export function generateSlug(text: string): string {
    const slug = text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')        // Replace spaces with hyphens
        .replace(/ğ/g, 'g')          // Replace Turkish characters
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
        .replace(/\-\-+/g, '-')      // Replace multiple hyphens with single hyphen
        .replace(/^-+/, '')          // Trim hyphens from start
        .replace(/-+$/, '');         // Trim hyphens from end

    // Rastgele bir ID ekleyerek benzersiz yap
    const randomId = Math.random().toString(36).substring(2, 6);
    return `${slug}-${randomId}`;
}

/**
 * Truncates a string to the specified length
 * 
 * @param text Text to truncate
 * @param maxLength Maximum length of the resulting string
 * @param suffix Optional suffix to add at the end of truncated text (default: '...')
 * @returns Truncated string
 */
export function truncateString(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalizes the first letter of a string
 * 
 * @param text Text to capitalize
 * @returns Text with first letter capitalized
 */
export function capitalizeFirstLetter(text: string): string {
    if (!text || text.length === 0) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
} 