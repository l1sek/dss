import { Source, DecisionProblem, Alternative, Property } from "../model";
const AlternativeQuery = require("./mongo_models/AlternativeQuery");
const PropertyQuery = require("./mongo_models/PropertyQuery");

export class Proxy {
    private source:Source;

    constructor(source:Source) {
        this.source = source;
    }

    async getAlternatives(decisionProblem:DecisionProblem): Promise<{}> {
        let response = {};
        let mongoDispatcher = new MongoDispatcher(this.source.key);
        // check if there is response for such query in database
        let lastKnownResponse = await mongoDispatcher.getLastAlternativesResponse(decisionProblem);
        if (lastKnownResponse) {
            response = {
                source: this.source.key,
                results: lastKnownResponse,
            };    
        } else {
            let promise:Promise<Alternative[]> = this.source.getAlternatives(decisionProblem);
            promise.then((alternatives:Alternative[]) => {
                mongoDispatcher.saveAlternativesResponse(decisionProblem, alternatives);
                response = {
                    source: this.source.key,
                    results: alternatives.map(a => a.toJson()),
                };    
            }).catch(error => {
                response = {error: error}
            })
            await promise;
        }
        return response;
    }

    async getProperty(decisionProblem:DecisionProblem, alternative:Alternative, propertyKey: string): Promise<Property> {
        let response = new Property(propertyKey, this.source.key);
        let mongoDispatcher = new MongoDispatcher(this.source.key);
        let lastKnownResponse = await mongoDispatcher.getLastPropertyResponse(decisionProblem, alternative, propertyKey);
        if (lastKnownResponse) { // cached in DB
            lastKnownResponse.forEach((element:any) => {
                response.addValue(element);
            });
        } else { // not cached in DB
            if (this.source.isAvailable()) {
                await this.source.getProperty(alternative, propertyKey)
                .then(property => {
                    if (!property.isEmpty()) { // save only if some data received
                        mongoDispatcher.savePropertyResponse(decisionProblem, alternative, property);
                    }
                    response = property;
                })
                .catch(error => {
                    console.log("[ERROR]" + error)
                });
            }
        }
        return response;
    }
}

class MongoDispatcher {
    private sourceKey:String;

    constructor(sourceKey:String) {
        this.sourceKey = sourceKey;
    }

    saveAlternativesResponse(problem:DecisionProblem, alternatives:Array<Alternative>) {
        new AlternativeQuery({
            source: this.sourceKey,
            decision: problem.key,
            response: alternatives.map(a => a.toJson()),
        })
        .save()
        .then((doc:any) => {
            console.log("Alternatives succesfully saved in database.");
        })
        .catch((error:any) => {
            console.error(error)
        });
    }

    savePropertyResponse(problem:DecisionProblem, alternative:Alternative, property:Property) {
        new PropertyQuery({
            source: this.sourceKey,
            decision: problem.key,
            alternativeKey: alternative.key,
            property: property.key,
            response: property.getValues(),
        })
        .save()
        .then((doc:any) => {
            console.log(`Property '${property.key}' of alternative key '${alternative.key}' succesfully saved in database.`);
        })
        .catch((error:any) => {
            console.error(error)
        });
    }

    async getLastAlternativesResponse(problem:DecisionProblem) {
        return await AlternativeQuery
            .findOne({
                source: this.sourceKey,
                decision: problem.key,
            },{},{ sort: { 'date' : -1 } }
            ).then((doc:any) => {
                if (doc) {
                    return doc.response;
                } {
                    return;
                }
            }).catch((error:any) => {
                console.log(error);
                throw new Error("An error occurred during db connection: " + error);
            });
    }

    async getLastPropertyResponse(problem:DecisionProblem, alternative:Alternative, propertyKey:string) {
        return await PropertyQuery
            .findOne({
                source: this.sourceKey,
                decision: problem.key,
                alternativeKey: alternative.key,
                property: propertyKey,
            },{},{ sort: { 'date' : -1 } }
            ).then((doc:any) => {
                if (doc) {
                    return doc.response;
                } {
                    return;
                }
            }).catch((error:any) => {
                console.log(error);
                throw new Error("An error occurred during db connection: " + error);
            });
    }
}