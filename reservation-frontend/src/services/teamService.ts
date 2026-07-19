import axios from 'axios';

export interface TeamMember {
    id: string;
    email: string;
    /** 0 = Owner, 1 = Admin, 2 = Member (staff) */
    role: number;
    isActive: boolean;
    createdAt: string;
}

export interface StaffCreated {
    id: string;
    email: string;
    tempPassword: string;
}

export const ROLE_LABELS: Record<number, string> = {
    0: "Owner",
    1: "Admin",
    2: "Staff",
};

export class TeamService {
    static async getTeam(): Promise<TeamMember[]> {
        const response = await axios.get<TeamMember[]>('/team');
        return response.data;
    }

    static async inviteStaff(email: string): Promise<StaffCreated> {
        const response = await axios.post<StaffCreated>('/team', { email });
        return response.data;
    }

    static async removeStaff(id: string): Promise<void> {
        await axios.delete(`/team/${id}`);
    }
}
