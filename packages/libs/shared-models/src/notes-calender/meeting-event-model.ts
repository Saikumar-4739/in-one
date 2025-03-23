export class MeetingEventModel {
    title: string;
    startDate: string; // ISO 8601 format (e.g., "2025-03-23T10:00:00Z")
    endDate: string;   // ISO 8601 format
    description?: string;
    participantIds: string[]; // Array of user IDs

    constructor(
        title: string,
        startDate: string,
        endDate: string,
        participantIds: string[],
        description?: string
    ) {
        this.title = title;
        this.startDate = startDate;
        this.endDate = endDate;
        this.participantIds = participantIds;
        this.description = description;
    }
}
