import DecisionProblems from "../DecisionProblems.json";

export class DecisionProblem {
    readonly key: string;
    readonly sources: Array<any>;
    readonly propertyKeys: Array<string>;

    constructor(problemKey: string) {
        var problemDefinition = DecisionProblems.find(p => p.key === problemKey);
        if (problemDefinition) {
            this.key = problemKey;
            this.sources = problemDefinition.sources;
            this.propertyKeys = Object.keys(problemDefinition.properties);
        } else {
            throw new Error("Cannot initialize DecisionProblem. No definition of problem for given key: " + problemKey);
        }
    }
}

export class Alternative {
    public readonly key: string;
    private properties: Array<Property>;

    constructor(decisionProblem: DecisionProblem, alternativeKey: string, label: string, sourceKey: string) {
        this.key = (sourceKey.length ? sourceKey  + ':' : '') + alternativeKey;
        this.properties = decisionProblem.propertyKeys.map(p => new Property(p, sourceKey));
        this.getProperty('label').addValue(label);
    }
    
    public getProperties(): Array<Property> {
        return this.properties;
    }

    public getProperty(propertyKey: string): Property {
        let property = this.properties.find(p => p.key === propertyKey);
        if (!property) {
            throw new Error("There is no any property for key '" + propertyKey + "' for alternative " + this.key);
        }
        return property;
    }

    public toJson(): {} {
        let properties:any = {};
        this.properties.forEach((property:Property) => {
            properties[property.key] = property.getValues();
        });
        return {
            key: this.key,
            properties: properties,
        };
    }

    public static fromOtherAlternative(decisionProblem:DecisionProblem, other:Alternative):Alternative {
        let alt = new Alternative(decisionProblem, other.key, "", "");
        alt.properties = Object.keys(other.properties).map((propertyKey:any) => {
            let property = new Property(propertyKey, "");
            let otherPropertyValues:any = other.properties[propertyKey];
            otherPropertyValues.forEach((element:any) => {
                property.addValue(element);
            });
            return property;
        });
        return alt;
    }
}

export class Property {
    public readonly key: string;
    public readonly source: string;
    private values: Array<{}|string> = [];

    constructor(propertyKey: string, sourceKey: string) {
        this.key = propertyKey;
        this.source = sourceKey;
    }

    public addValue(value:any) {
        switch(typeof value) {
            case 'string':
                value = value.trim();
                if (!value.length) {
                    return;
                }
                break;
            case 'object':
                break;
            default:
                return;
        }
        this.values.push(value);
    }

    public getValues(): Array<any> {
        return this.values;
    }

    public isEmpty(): boolean {
        return this.values.length === 0;
    }
}

export interface Source {
    key: string;
    isAvailable(): boolean;

    getAlternatives(decision: DecisionProblem): Promise<Alternative[]>;
    getProperty(alternative: Alternative, propertyKey: string): Promise<Property>;
}