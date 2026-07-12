export const STORAGE_BUCKETS = {
  userAvatars: "user-avatars",
  disciplineCovers: "discipline-covers",
  certificateSignatures: "certificate-signatures",
  institutionBranding: "institution-branding",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
