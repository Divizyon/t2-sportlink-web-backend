/**
 * Uygulama genelinde kullanılan enum tipleri
 * Bu tip güvenliği sağlar ve string literallerin yanlış yazılma riskini azaltır
 */

// Kullanıcı rolleri
export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    SUPERADMIN = 'superadmin'
}

// Friendship request durumları
export enum FriendshipRequestStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected'
}

// Etkinlik durumları
export enum EventStatus {
    UPCOMING = 'upcoming',
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

// Etkinlik katılımcı rolleri
export enum EventParticipantRole {
    CREATOR = 'creator',
    PARTICIPANT = 'participant'
}

// Bildirim tipleri
export enum NotificationType {
    EVENT_INVITATION = 'event_invitation',
    EVENT_REMINDER = 'event_reminder',
    FRIEND_REQUEST = 'friend_request',
    FRIEND_ACCEPTED = 'friend_accepted',
    SYSTEM = 'system'
}

// Rapor durumları
export enum ReportStatus {
    PENDING = 'pending',
    RESOLVED = 'resolved',
    REJECTED = 'rejected'
}

// Yetenek seviyeleri
export enum SkillLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    PROFESSIONAL = 'professional'
}

// Admin log action tipleri
export enum AdminActionType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    BLOCK = 'block',
    UNBLOCK = 'unblock'
}

// Cihaz platformları
export enum DevicePlatform {
    IOS = 'ios',
    ANDROID = 'android',
    WEB = 'web'
} 