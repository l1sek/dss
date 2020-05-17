import { SourceImplementations } from '../sources/index';
import { DecisionProblem, Source, Alternative, Property } from '../model';
import { Proxy } from './proxy';

import AlternativesProperties from "../../AlternativesProperties.json";


var express = require("express");
var router = express.Router();

router.get("/decisions/:itemId", function(req:any, res:any) {
    let problemKey = req.params.itemId.toUpperCase();
    let problem = new DecisionProblem(problemKey);
    collectAlternatives(problem)
        .then(async responses => {
            let results:Array<{}> = [];
            await Promise.all(responses.map(async (response:any) => {
                return collectMissingProperties(problem, response.source, response.results);
            })).then(responses => {
                responses.forEach(response => {
                    results = results.concat(response)
                });
            });
            res.send({results: results});
        }).catch(error => {
            res.status(500);
            res.send({ error: error});
        });
});

function collectAlternatives(problem:DecisionProblem) {
    // LOOP OVER ALL SOURCES FOR THE DECISION PROBLEM
    return Promise.all(Object.keys(problem.sources).map((source:any) => {
        let sourceImplementation:Source = SourceImplementations.getSource(problem.sources[source].key);
        let proxy:Proxy = new Proxy(sourceImplementation);
        return proxy.getAlternatives(problem);
    }));
}

async function collectMissingProperties(problem:DecisionProblem, sourceKey:string, alternatives:Array<{}>):Promise<Array<{}>> {
    if (alternatives && alternatives.length) {
        // Step 1. filter those properties thich should be donwloaded different source
        return Promise.all(AlternativesProperties.filter(p => problem.propertyKeys.find(element => element == p.key) && 
            p.sources && Object.keys(p.sources).filter(s => s !== sourceKey).length).map(async property => {
            // Step 2. loop through sources in given property
            return Promise.all(Object.keys(property.sources || {}).map((sourceKey: string) => {
                try {
                    // Step 3. for every source on this property
                    let proxy:Proxy = new Proxy(SourceImplementations.getSource(sourceKey));
                    // Step 4. for every alterative: download from source property value
                    return Promise.all(alternatives.map(async (alternative:any) => { 
                        let newAlternative:Alternative = Alternative.fromOtherAlternative(problem, alternative);
                        await proxy.getProperty(problem, newAlternative, property.key)
                            .then((response:Property) => {
                                alternative.properties[property.key] = response.getValues();
                            });
                    }));
                } catch(error) {
                    console.log(error);
                }
            }));
        })).then(() => {
            return alternatives;
        }).catch(error => {
            console.log("[ERROR] " + error);
            return alternatives;
        });
    }
    return alternatives;
}

module.exports = router;