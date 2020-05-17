import { Source, DecisionProblem, Alternative, Property } from "../model";


export class GitHub implements Source {
    public readonly key = 'gh';

    isAvailable(): boolean {
        return true; // TODO 
    }
    getAlternatives(decision:DecisionProblem): Promise<Alternative[]> {
        throw new Error("Method not implemented.");
    }
    getProperty(alternative:Alternative, propertyKey: string): Promise<Property> {
        throw new Error("Method not implemented.");
    }

    
}