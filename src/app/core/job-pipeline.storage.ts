import { JobCard } from "./job-pipeline.model";


const KEY = 'lifeCopilot.pipeline.job';
const MAX_ITEMS = 200;

export function loadJobCards(): JobCard[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as JobCard[];
        return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
    } catch {
        return [];
    }
}

export function saveJobCards(items: JobCard[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
}

export function addJobCard(card: JobCard): void {
    const storedCards: JobCard[] = loadJobCards();
    const udpatedJobCards: JobCard[] = [card, ...storedCards];
    saveJobCards(udpatedJobCards);

}

export function updateJobCard(newCard: JobCard): void {
    const storedCards: JobCard[] = loadJobCards();
    const updatedCards: JobCard[] = storedCards.map(card => card.id == newCard.id ? newCard : card);
    saveJobCards(updatedCards);
}

export function removeJobCardById(idToRemove: string): void {
    const items: JobCard[] = loadJobCards();
    const updatedJobCards: JobCard[] = items.filter(item => item.id !== idToRemove);
    saveJobCards(updatedJobCards);
}
