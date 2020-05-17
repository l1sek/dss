import { Source, DecisionProblem, Alternative, Property } from "../model";

import AlternativesProperties from "../../AlternativesProperties.json";

import fetch from "node-fetch";

const SE_API_URL      = 'https://api.stackexchange.com/2.2';
const SE_START_YEAR   = 2008;
const SE_DEFAULT_SITE = 'stackoverflow';

export class StackExchange implements Source {
    public readonly key = 'se';

    isAvailable(): boolean {
        // TODO
        return true;
    }

    getAlternatives(decision:DecisionProblem): Promise<Alternative[]> {
        throw new Error("Method not implemented.");
    }

    async getProperty(alternative:Alternative, propertyKey: string): Promise<Property> {
        let property = new Property(propertyKey, this.key);
        if (propertyKey === 'popularity') { // this source supports popularity property
            let propertySourceParams = ((AlternativesProperties.find(p => p.key === propertyKey) || {}).sources || {}).se;
            if (propertySourceParams) {
                let site = propertySourceParams.site || SE_DEFAULT_SITE;
                var tag = this.getMainTag(alternative.getProperty('stackexchange_tag').getValues());
                if (!tag) {
                    return property;
                }
                return Promise.all(this.getYears(SE_START_YEAR, new Date().getFullYear()).map(year => {
                    if (!tag) return;
                    return this.sendRequest(year, tag, site);
                })).then((d:any) => {
                    if (d.every((el:any) => el.total >= 0)) {
                        d.forEach((el:any) => property.addValue(el));
                    }
                    return property;
                }).catch(error => {
                    throw new Error("An error occurred during fetch from '" + this.key + "' source: " + error);
                });
            } else {
                throw new Error("There is not '" + this.key + "' source defined for property " + propertyKey);
            }
        }
        return property;
    }

    getYears(startYear:number, endYear:number):number[] {
        let array:number[] = [];
        for (let year:number = startYear; year <= endYear; year++ ) {
            array.push(year);
        }
        return array;
    }

    getMainTag(tags:string[]) {
        let tag = tags.find(t => t.startsWith(`https://${SE_DEFAULT_SITE}.com/tags/`));
        if (tag) {
            return tag.trim().split("/").pop();
        }
    }

    async sendRequest(year:number, tag:string, site:string) {
        let fromTime = (new Date(year, 0, 1)).getTime() / 1000 | 0;
        let toTime = (new Date(year, 11, 31)).getTime() / 1000 | 0;  
        let request = SE_API_URL + `/questions?fromdate=${fromTime}&todate=${toTime}&tagged=${tag}&site=${site}&filter=total`;
		const headers = { 'Accept': 'application/json' };
		const body = await fetch(request, { headers });
        return await body.json().then(d => {
            if (d.total >= 0)
                return ({
                    year: year,
                    total: d.total
                });
            else {
                return {
                    year: year,
                    error: d.error_message,
                };   
            }
        });
    }
}