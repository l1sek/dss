import React, { Component } from 'react';
import Card from 'react-bootstrap/Card';
import AlternativesProperties from '../AlternativesProperties.json';
import UpIcon from '../img/up.png';
import NeutralIcon from '../img/neutral.png';
import DownIcon from '../img/down.png';

export default class Alternative extends Component {
    constructor(props) {
        super(props);

        this.state = {};

        this.handleAlternativeClick = this.handleAlternativeClick.bind(this);
    }

    render() {
        return (
            <Card
              className={"alt-box"
                + (this.props.selected ? " alt-selected" : "")
                + (this.props.disabled ? " alt-unavailable" : "")
                + (this.isVisible() ? "" : " alt-hidden")
                }
              id={this.props.altKey}
              onClick={this.handleAlternativeClick}
            >
                <Card.Header className="alt-name" title={this.props.properties.label}>
                    {this.props.properties.label}
                </Card.Header>
                <Card.Body className="alt-properties">
                    {Object.keys(this.props.properties).map(p => this.renderProperty(p))}
                </Card.Body>
                <Card.Footer className="alt-score">
                    score: {this.props.score === undefined ?
                        <span style={{'font-style': 'italic'}}>undefined</span> :
                        <span>{this.toPercentage(this.props.score)}%</span>}
                </Card.Footer>
            </Card>
        );
    }

    isVisible() {
        return this.props.filters.every(filter => {
            if (filter.filter) { // this filter is active
                let filterFrom = filter.filter.from;
                let filterTo = filter.filter.to;
                let filterValues = (filter.filter.values || []).map(f => f.toUpperCase());
                switch (this.props.propertiesDescription[filter.propertyKey].type) {
                    default:
                    case 'string':
                        return filterValues.some(v => this.comparepropertyValue(filter.propertyKey, v, true, true));
                    case 'tag':
                        return filterValues.some(v => {
                            return this.props.properties[filter.propertyKey].some(p => {
                                if (!p) {
                                    return false;
                                }
                                return p.split("/").pop().trim().toUpperCase() === v;
                            })
                        });
                    case 'date':
                        filterFrom = filterFrom ? filterFrom.split('/').join('-') : null;
                        filterTo = filterTo ? filterTo.split('/').join('-') : null;
                        // falls through
                    case 'number':
                        return this.props.properties[filter.propertyKey].some(d => {
                            if (!d) {
                                return false;
                            }
                            return (filterFrom ? filterFrom <= d : true)
                                && (filterTo ? filterTo >= d : true);
                        });
                    case 'timeline':
                        let sum = this.props.timelines[filter.propertyKey].sum;
                        if (!sum) {
                            return false;
                        }
                        return (filterFrom ? Number(filterFrom) <= sum : true)
                        && (filterTo ? Number(filterTo) >= sum : true);
                }
            } else {
                return true;
            }
        });
    }

    toPercentage(value) {
        return Math.round(value * 10000) / 100;
    }

    /**
     * Check if given value is contained in propertyKey values.
     * @param {String} propertyKey
     * @param {String} value
     * @param {boolean} ignoreCase
     * @param {boolean} searchMode means it will look for fragments of the values: if 'value' is "bcde" and one of 'myValues' is "abcdef" it will return true;
     */
    comparepropertyValue(propertyKey, value, ignoreCase, searchMode) {
        if (!Array.isArray(value)) {
            value = [value].filter(Boolean);
        }
        if (value.length > 0) {
            let myValues = this.props.properties[propertyKey];
            if (myValues.length > 0) {
                if (ignoreCase) {
                    myValues = myValues.map(v => v.toUpperCase());
                }

                if (searchMode) {
                    return value.every(v => myValues.some(myValue => myValue.includes(v)));
                } else {
                    return value.every(v => myValues.includes(v));
                }
            }
        }
        return false;
    }

    renderProperty(propertyKey) {
        if (propertyKey === 'label') {
            return; // don't render name as a property
        }
        let propertyDefinition = AlternativesProperties.find(element => element.key === propertyKey);
        let propertyValues = this.props.properties[propertyKey];

        switch (propertyDefinition.type) {
            case 'timeline':
                if (propertyValues.length) {
                    let sorted = propertyValues.sort((a, b) => a.year < b.year);
                    let trend;
                    if (sorted.length >= 3) {
                        let a = sorted[0].total;
                        let b = sorted[1].total;
                        let c = sorted[2].total;
                        let max = Math.max(a,b,c);
                        let min = Math.min(a,b,c);
                        let avg = (a+b+c)/3;
                        if ((max - min)/avg <= 0.25) {
                            trend = NeutralIcon;
                        } else if (a >= c) {
                            trend = UpIcon;
                        } else if (a < c) {
                            trend = DownIcon;
                        }
                    }
                    propertyValues = [<span>{this.props.timelines[propertyKey].sum} {trend ? <img src={trend} alt='' height={12} /> :''} </span>];
                }
                break;
            case 'date':
                propertyValues = propertyValues.map(date => {
                    if (date && date.trim()) {
                        return new Date(date.trim()).toLocaleDateString();
                    }
                    return "";
                });
                break;
            case 'website':
                propertyValues = propertyValues.map(url => <a href={url.trim()} target={"blank_"}>{url.trim()}</a>)
                break;
            case 'tag':
                propertyValues = propertyValues.map(tag => <a href={tag.trim()} target={"blank_"}>{decodeURIComponent(tag.trim().split("/").pop())}</a>)
                break;
            default:
                // do nothing for other types
        }

        let propertyNameElement = propertyDefinition.name + ':';
        if (propertyValues.length) {
            propertyNameElement = <a
                    href="/#"
                    onClick={event => this.props.showPropertyView(propertyDefinition.name, propertyKey, this.props.properties[propertyKey])}
                    title="Click to see details of the property values"
                >
                    {propertyNameElement}
                </a>;
        }
        propertyNameElement = <span className="alt-property-label" style={propertyValues.length ? {} : {cursor: 'default'}}>{propertyNameElement}</span>;

        return (
            <div className="alt-property" key={propertyKey}>
                {propertyNameElement}
                &nbsp;
                {
                    propertyValues.map((val,i) =>
                        <React.Fragment>
                            {i > 0 && ', '}
                            <span>{val}</span>
                        </React.Fragment>
                    )
                }
            </div>
        );
    }

    handleAlternativeClick(event) {
        let targetClass = (event.target||{}).className || "";
        let targetTag = (event.target||{}).tagName || "";
        if (targetClass === 'alt-property-label' || targetClass.startsWith('popover') || targetTag.toUpperCase() === "A" || this.props.disabled) {
            return;
        }
        this.props.processAlternativeSelection(this.props.altKey, this.props.properties);
    }
}