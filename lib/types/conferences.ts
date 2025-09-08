// Base Conference type
export interface Conference {
  id: string;
  name: string;
  description: string | null;
  color: string;
  logo_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Types for database operations
export type InsertConference = Omit<Conference, 'id' | 'created_at' | 'updated_at'>;
export type UpdateConference = Partial<Omit<Conference, 'id' | 'created_at'>> & { id: string };

// For the teams table relationship
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Database {
    interface Tables {
      conferences: {
        Row: Conference;
        Insert: InsertConference;
        Update: UpdateConference;
      };

      teams: {
        Row: {
          conference_id: string | null;
        };
        Update: {
          conference_id?: string | null;
          updated_at?: string;
        };
      };
    }
  }
}

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
export type OnSaveConferenceCallback = (teamId: string, conferenceId: string | null) => Promise<void>;

export interface ConferenceWithTeamCount extends Conference {
  team_count: number;
}

export interface ConferenceFilters {
  is_active?: boolean;
  search?: string;
}

export interface ConferenceFormValues {
  name: string;
  short_name?: string;
  description?: string;
  color: string;
  logo_url?: string;
  is_active: boolean;
}
