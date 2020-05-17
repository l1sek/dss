import { Alternative, DecisionProblem, Property, Source } from '../model';

import AlternativesProperties from "../../AlternativesProperties.json";

import fetch from "node-fetch";

const SPARQL_ENDPOINT           = 'https://query.wikidata.org/sparql';
const SPARQL_DEFAULT_SEARCH_BY  = 'instance_of';
const SPARQL_SEPARATOR          = '@@@';
const SPARQL_LIMIT              = 500;

export class Wikidata implements Source {
    public readonly key = 'wd';
    isAvailable(): boolean {
        // TODO
        return true;
    }

    async getAlternatives(problem: DecisionProblem): Promise<Alternative[]> {
        let propertiesToSelect = AlternativesProperties.filter(p => (p.sources||{}).wd && problem.propertyKeys.find(element => element == p.key));
        if (!problem) {
            throw new Error("Can't get alternatives. No decision problem was given.");
        }
        let queryDispatcher = new SPARQLQueryDispatcher();
        let promise = await queryDispatcher.query( new QueryBuilder(problem, propertiesToSelect).build() )
             .then( data => this.convertDataToAlternatives(data, problem, propertiesToSelect));
        return promise;
    }

    async getProperty(alternative: Alternative, propertyKey: string): Promise<Property> {
        let property =  new Property(propertyKey, this.key);
        return property;
    }

    /*
    * Converts recived data into common form understandable to the application.
    */
    convertDataToAlternatives(data:any, decisionProblem:DecisionProblem, propertiesToSelect:Array<any>): Array<Alternative> {
        let alternatives: Array<Alternative> = [];

        

        data.results.bindings.forEach((obj:any) => {
            let wdId = obj.object.value.substring(obj.object.value.lastIndexOf('/')+1, obj.object.value.length).trim();
            if (wdId === obj.name.value) {
                return;
            }
            let alternative = new Alternative(decisionProblem, wdId, obj.name.value.trim(), this.key);
            
            propertiesToSelect.forEach((property:any) => {
                let propertyInstance:Property;
                try {
                    propertyInstance = alternative.getProperty(property.key);
                } catch(error) {
                    console.log(error);
                    return;
                }
            
                (obj[property.sources.wd.id].value || "")
                    .split(SPARQL_SEPARATOR)
                    .map((p:string) => {
                        switch (property.type) {
                            case 'date':
                                p = p.substr(0,10);
                                break;
                            default:
                        }
                        return p;
                    })
                    .forEach((p:string) => {
                        propertyInstance.addValue(p);
                    });
                });
            alternatives.push(alternative);
        });
        return alternatives;
    }
}

class QueryBuilder {
    private problem: DecisionProblem;
    private wdId: string;
    private searchByProperty: any;
    private propertiesToSelect: any;

    constructor(problem: DecisionProblem, propertiesToSelect: any) {
        if (problem) {
            let sourceWd = problem.sources.find(s => s.key === 'wd');
            if (sourceWd) {
                this.problem = problem;
                let searchByPropertyKey = sourceWd.search_by || SPARQL_DEFAULT_SEARCH_BY;
                this.searchByProperty = AlternativesProperties.find(p => p.key == searchByPropertyKey);
                this.wdId = sourceWd.id;
                this.propertiesToSelect = propertiesToSelect;
            } else {
                throw new Error('Cannot build SPARQL query to Wikidata. Source \'wd\' is not definied for problem: ' + problem.key);
            }
        } else {
            throw new Error('Cannot build SPARQL query to Wikidata for null decision problem given.');
        }
    }

    public build() { // builds query
        let query = `
            SELECT
                ?object
                ?name  `
        + this.propertiesToSelect.map((property: { sources: { wd: { id: any; }; }; }) => `
                (GROUP_CONCAT(DISTINCT ?${property.sources.wd.id}Label; SEPARATOR="${SPARQL_SEPARATOR}") AS ?${property.sources.wd.id}) `).join(' ')
        + `
            WHERE
            {
                SERVICE wikibase:label 
                {
                    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
                    ?object rdfs:label ?name.  `
        + this.propertiesToSelect.map((property: { sources: { wd: { id: any; }; }; }) =>  `
                    ?${property.sources.wd.id} rdfs:label ?${property.sources.wd.id}Label.  `).join(' ')
        + `
                }
                ?object wdt:${this.searchByProperty.sources.wd.id} wd:${this.wdId}.  `
        + this.propertiesToSelect.map((property: { sources: { wd: { id: any; }; }; }) => `
                OPTIONAL { ?object wdt:${property.sources.wd.id} ?${property.sources.wd.id} }  `).join(' ')
        + `
            }
            GROUP BY ?object ?name
            ORDER BY DESC (?incoming)
            LIMIT ${SPARQL_LIMIT} `;
        return query;
    }
}

class SPARQLQueryDispatcher {
	async query(sparqlQuery: string) {
		const fullUrl = SPARQL_ENDPOINT + '?query=' + encodeURIComponent( sparqlQuery );
		const headers = { 'Accept': 'application/sparql-results+json' };
		const body = await fetch(fullUrl, { headers });
        return await body.json();
	}
}
