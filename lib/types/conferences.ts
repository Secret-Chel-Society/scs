// Base Conference type
export interface Conference {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

// Types for database operations
export type InsertConference = Omit<Conference, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type UpdateConference = Partial<Omit<Conference, 'id' | 'created_at'>> & {
  updated_at?: string;
};

// Type for team with conference relationship
export interface TeamWithConference {
  id: string;
  name: string;
  conference_id: string | null;
  conference?: Conference | null;
  created_at: string;
  updated_at: string;
}

// Type for updating team conference
export interface UpdateTeamConferenceParams {
  teamId: string;
  conferenceId: string | null;
}

// Type for the onSave callback
export type OnSaveConferenceCallback = (teamId: string, conferenceId: string | null) => Promise<void> | void;
