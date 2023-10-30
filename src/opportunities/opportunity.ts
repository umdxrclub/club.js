export interface Opportunity {
  name: string;
  organization: string;
  isActive: boolean,
  type?: string | undefined;
  url?: string | undefined;
  organizationImageUrl?: string | undefined;
  thumbnailUrl?: string | undefined;
  description?: string | undefined;
  tags?: string[] | undefined;
}
