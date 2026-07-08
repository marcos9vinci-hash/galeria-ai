// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  settings: Record<string, any>;
  plan: 'free' | 'pro' | 'enterprise';
  max_users: number;
  max_posts_per_month: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_by?: string;
  joined_at: string;
  user?: {
    id: string;
    email: string;
  };
}

export const organizationService = {
  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async createOrganization(org: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({ ...org, settings: org.settings || {} })
      .select()
      .single();
    
    if (orgError) throw orgError;

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgData.id,
        user_id: user.id,
        role: 'owner',
      });
    
    if (memberError) {
      // Rollback org creation
      await supabase.from('organizations').delete().eq('id', orgData.id);
      throw memberError;
    }

    return orgData;
  },

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteOrganization(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        user:auth.users(id, email)
      `)
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async inviteMember(organizationId: string, email: string, role: OrganizationMember['role'] = 'member'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('user_id', (await supabase.auth.admin.getUserByEmail(email)).data?.user?.id)
      .single();

    if (existingUser) throw new Error('User already a member');

    // Use Supabase Auth invite (sends email)
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
      data: { organization_id: organizationId, role },
    });
    
    if (error) throw error;
  },

  async updateMemberRole(organizationId: string, userId: string, role: OrganizationMember['role']): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('organization_id', organizationId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async removeMember(organizationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        organization:organizations(*)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data?.map(m => m.organization).filter(Boolean) || [];
  },

  async getCurrentUserRole(organizationId: string): Promise<OrganizationMember['role'] | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    
    if (error) return null;
    return data?.role || null;
  },

  async canManageOrganization(organizationId: string): Promise<boolean> {
    const role = await this.getCurrentUserRole(organizationId);
    return role === 'owner' || role === 'admin';
  },

  async canManageMembers(organizationId: string): Promise<boolean> {
    const role = await this.getCurrentUserRole(organizationId);
    return role === 'owner' || role === 'admin';
  },
};