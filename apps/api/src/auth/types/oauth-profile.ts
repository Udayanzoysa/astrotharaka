export type OAuthProviderName = 'GOOGLE' | 'FACEBOOK';

export type OAuthProfile = {
  provider: OAuthProviderName;
  providerUserId: string;
  email: string;
  fullName: string;
};
