import React, { Component } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';

import * as Config from '../constans/FormParams';

import LoadingIndicator from '../img/indicator.gif';

import DecisionProblems from '../DecisionProblems.json';
import AlternativesProperties from '../AlternativesProperties.json';
import Alternative from './Alternative';
import FiltersDialog from './FiltersDialog';
import FactorsDialog from './FactorsDialog';
import PropertyView from './PropertyView';

export default class Decision extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            alternatives: [],
            propertiesDescription: this.calculateProperties(),
            selectedKey: undefined,
            dependencies: this.calculateDependencies(),
            sortBy: 'score',
            showFiltersDialog: false,
            showFactorsDialog: false,
            showPropertyView: false,
            factors: this.calculateFactors(),
            filters: this.calculateFilters(),
            contentPropertyView: {},
        };

        this.handleButtonClick = this.handleButtonClick.bind(this);
        this.handleFiltersSave = this.handleFiltersSave.bind(this);
        this.handleFactorsSave = this.handleFactorsSave.bind(this);
        this.handlePropertyViewShow = this.handlePropertyViewShow.bind(this);
        this.handlePropertyViewHide = this.handlePropertyViewHide.bind(this);
        this.processAlternativeSelection = this.processAlternativeSelection.bind(this);
    }

    /*****************************
     *          RENDER           *
     *****************************/

    render() {
        let activeFilters = this.state.filters.filter(f => f.filter && (f.filter.values || f.filter.to || f.filter.from )).length;
        return (
            <div className="dec-row">

                <Form inline className="justify-content-between">
                    <h5>
                        <span className="dec-name">{this.props.problem.name}</span>: <span>{this.props.name}</span>
                        {this.renderDependencies()}
                    </h5>
                    <ButtonToolbar>
                        <ButtonGroup>
                            <Button id="btn-filter" variant="outline-primary" size="sm" onClick={this.handleButtonClick}>
                                Filter
                                {activeFilters ? <React.Fragment>&nbsp;&nbsp;<Badge variant="warning">{activeFilters}</Badge></React.Fragment> : ""}
                            </Button>
                            <DropdownButton variant="outline-primary" size="sm" as={ButtonGroup} title="Sort">
                                <Dropdown.Item id={"btn-sort-score"} onClick={this.handleButtonClick} active={this.state.sortBy === 'score'}>Score</Dropdown.Item>
                                <Dropdown.Divider />
                                {Object.keys(this.props.problem.properties).map(p =>
                                    <Dropdown.Item id={"btn-sort-" + p} onClick={this.handleButtonClick} active={this.state.sortBy === p}>
                                        {AlternativesProperties.find(a => a.key === p).name}
                                    </Dropdown.Item>
                                )}
                            </DropdownButton>
                            <Button id="btn-factors" variant="outline-primary" size="sm" onClick={this.handleButtonClick}>Weighting factors</Button>
                            <Button id="btn-delete" variant="outline-danger" size="sm" onClick={this.handleButtonClick}>Remove</Button>
                        </ButtonGroup>
                    </ButtonToolbar>
                </Form>
                <FiltersDialog
                    show={this.state.showFiltersDialog}
                    propertiesDescription={this.state.propertiesDescription}
                    filters={this.state.filters}
                    applyFilters={this.handleFiltersSave}
                />
                <FactorsDialog
                    show={this.state.showFactorsDialog}
                    propertiesDescription={this.state.propertiesDescription}
                    factors={this.state.factors}
                    applyFactors={this.handleFactorsSave}
                />
                <PropertyView
                    show={this.state.showPropertyView}
                    onHide={this.handlePropertyViewHide}
                    title={this.state.contentPropertyView.title}
                    propertyKey={this.state.contentPropertyView.propertyKey}
                    value={this.state.contentPropertyView.value}
                />

                <div className="dec-alternatives">
                    {(this.state.isLoading ? this.renderIndicator() : this.renderCells())}
                </div>

            </div>
        );
    }

    renderDependencies() {
        return this.state.dependencies.map(dependency =>
                <Badge pill variant={this.shouldHighlightDependency(dependency) ? "primary" : "secondary"} className="dec-constraints">
                    {dependency.type === 'i' ? "Influenced" : "Triggered"} by: {DecisionProblems.find(p => p.key === dependency.key).name}
                    {this.props.choices[dependency.key] && dependency.type === 'i' ? " (" + this.props.choices[dependency.key].label + ")" : ""}
                </Badge>
            )
    }

    shouldHighlightDependency(dependency) {
        if (dependency.type === 'i') {
            return this.props.choices[dependency.key];
        } else {
            return (this.props.choices[dependency.key] || []).label === dependency.triggeredValue;
        }
    }

    renderIndicator() {
        return (
            <div className="dec-loading">
                <img src={LoadingIndicator} alt="" /> Data gathering...
            </div>
        );
    }

    renderCells() {
        let constraints = {};
        Object.keys(this.props.problem.properties).forEach(propertyKey => {
            constraints[propertyKey] = this.getConstraintForProperty(propertyKey);
        });

        return (
            this.state.alternatives.map((alt) =>
                <Alternative
                    key={alt.key}
                    altKey={alt.key}
                    properties={alt.properties}
                    timelines={alt.timelines}
                    propertiesDescription={this.state.propertiesDescription}
                    problem={this.props.problem}
                    constraints={constraints}
                    score={alt.score}
                    filters={this.state.filters}
                    selected={this.state.selectedKey === alt.key}
                    disabled={!this.isAlternativeAvailable(alt.properties, constraints)}
                    processAlternativeSelection={this.processAlternativeSelection}
                    showPropertyView={this.handlePropertyViewShow}
                />
            )
        );
    }

    /******************************
     *       REACT METHODS        *
     ******************************/

    shouldComponentUpdate(nextProps, nextState) {
        if ((this.props.choices[this.props.problem.key]||{}).label !== (nextProps.choices[this.props.problem.key]||{}).label) {
            return true; // must update if change is inside this decision change
        }
        if (JSON.stringify(this.props.choices) !== JSON.stringify(nextProps.choices) && this.state.dependencies.length > 0) {
            let shouldUpdate = false;
            this.state.dependencies.forEach(dep => {
                if ((this.props.choices[dep.key]||{}).label !== (nextProps.choices[dep.key]||{}).label) {
                    shouldUpdate = true;
                }
            });
            return shouldUpdate;
        }
        return true;
    }

    componentDidMount() {
        fetch("http://localhost:5000/api/decisions/" + this.props.problem.key)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('An error occurred during data fetch...');
                }
            })
            .then(data => {
                let extremeValues = {};
                Object.keys(this.props.problem.properties).forEach(p => {
                    extremeValues[p] = {min: undefined, max: undefined};
                });

                let timelines = Object.keys(this.state.propertiesDescription).filter(pd => this.state.propertiesDescription[pd].type === 'timeline');
                let alternatives = data.results.map(alt => {
                    alt.selected = false;
                    alt.timelines = {};
                    timelines.forEach(timeline => {
                        let allTotals = alt.properties[timeline].map(v => v.total);
                        let sum = allTotals.reduce((sum,v) => sum + v, 0);
                        alt.timelines[timeline] = {
                            sum: (allTotals.length ? sum : undefined),
                            min: (allTotals.length ? Math.min(...allTotals): undefined),
                            max: (allTotals.length ? Math.max(...allTotals): undefined),
                            avg: (allTotals.length ? sum/allTotals.length: undefined),
                        }
                    });
                    this.calculateExtremeValues(alt, extremeValues);
                    return alt;
                });

                this.setState({
                    alternatives: alternatives.map(alt => {
                        alt.score = this.calculateScore(alt, this.state.factors, extremeValues);
                        return alt;
                    }),
                    extremeValues: extremeValues,
                    isLoading: false,
                });
                this.sortAlternatives();
            }).catch(err => console.log(err));
    }

    calculateExtremeValues(alternative, extremeValues) {
        Object.keys(alternative.properties).forEach(propertyKey => {
            let values = [];
            if (this.state.propertiesDescription[propertyKey].type === 'timeline' && alternative.timelines[propertyKey].sum !== undefined) {
                values = [alternative.timelines[propertyKey].sum];
            } else {
                values = alternative.properties[propertyKey];
            }

            if (this.state.propertiesDescription[propertyKey].dual) {
                values.forEach(value => {
                    // MINIMUM
                    if (extremeValues[propertyKey].min !== undefined) {
                        if (value < extremeValues[propertyKey].min) {
                            extremeValues[propertyKey].min = value;
                        }
                    } else {
                        extremeValues[propertyKey].min = value;
                    }

                    // MAXIMUM
                    if (extremeValues[propertyKey].max !== undefined) {
                        if (value > extremeValues[propertyKey].max) {
                            extremeValues[propertyKey].max = value;
                        }
                    } else {
                        extremeValues[propertyKey].max = value;
                    }
                });
            } else {
                // MINIMUM
                if (extremeValues[propertyKey].min !== undefined) {
                    if (values.length < extremeValues[propertyKey].min) {
                        extremeValues[propertyKey].min = values.length;
                    }
                } else {
                    extremeValues[propertyKey].min = values.length;
                }

                // MAXIMUM
                if (extremeValues[propertyKey].max !== undefined) {
                    if (values.length > extremeValues[propertyKey].max) {
                        extremeValues[propertyKey].max = values.length;
                    }
                } else {
                    extremeValues[propertyKey].max = values.length;
                }
            }
        });
    }

    isAlternativeAvailable(properties, constraints) {
        var activeConstraints = Object.keys(constraints).reduce(function (filtered, key) {
            if (constraints[key].length > 0) {
                filtered[key] = constraints[key];
            }
            return filtered;
        }, {});

        return Object.keys(activeConstraints).every(propertyKey => // check if every constraint (property value)
            activeConstraints[propertyKey].some( // check if at least 1 constraint is fulfiled
                value => this.comparepropertyValue(properties, propertyKey, value)
            )
        );
    }

    /**
     * Check if given value is contained in propertyKey values.
     * @param {String} propertyKey
     * @param {String} value
     * @param {Object} properties
     */
    comparepropertyValue(properties, propertyKey, value) {
        if (!Array.isArray(value)) {
            value = [value].filter(Boolean);
        }
        if (value.length > 0) {
            let myValues = properties[propertyKey];
            if (myValues.length > 0) {
                return value.every(v => myValues.includes(v));
            }
        }
        return false;
    }

    /*****************************
     *          HANDLERS         *
     *****************************/

    handleButtonClick(event) {
        let id = event.currentTarget.id.split('-');
        if (id.length < 2) {
            return;
        }
        switch(id[1]) {
            case 'filter':
                this.setState({showFiltersDialog: true});
                break;
            case 'sort':
                this.sortAlternatives(id[2]);
                break;
            case 'factors':
                this.setState({showFactorsDialog: true});
                break;
            case 'delete':
                this.props.onDecisionDelete({ problemKey: this.props.problem.key});
                break;
            default:
        }
    }

    handleFiltersSave(filtersSettings) {
        this.setState({
            showFiltersDialog: false,
            filters: filtersSettings ? filtersSettings : this.state.filters,
        });
    }

    handleFactorsSave(factors) {
        factors = factors ? factors : this.state.factors;
        this.setState({
            showFactorsDialog: false,
            factors: factors,
            alternatives: this.state.alternatives.map(alt => {
                alt.score = this.calculateScore(alt, factors, this.state.extremeValues);
                return alt;
            }),
        });
        if (this.state.sortBy === 'score') {
            this.sortAlternatives();
        }
    }

    handlePropertyViewShow(title, propertyKey, value) {
        this.setState({
            showPropertyView: true,
            contentPropertyView: {
                title: title,
                propertyKey: propertyKey,
                value: value,
            },
        });
    }

    handlePropertyViewHide() {
        this.setState({ showPropertyView: false });
    }

    /*****************************
     *         PROCESSING        *
     *****************************/

    processAlternativeSelection(altKey, properties) {
        if (this.state.selectedKey === altKey) {
            altKey = undefined;
            properties = undefined;
        }
        this.setState({selectedKey: altKey});
        this.props.onDecisionChange({ problemKey: this.props.problem.key, value: properties });
    }

    calculateProperties() {
        let properties = {};
        Object.keys(this.props.problem.properties).forEach(propertyKey => {
            let propertyDef = AlternativesProperties.find(a => a.key === propertyKey);
            properties[propertyKey] = {
                name: propertyDef.name,
                type: propertyDef.type,
                dual: Config.FILTER_DUAL_FIELDS_TYPES.includes(propertyDef.type),
            };
        });
        return properties;
    }

    calculateDependencies() {
        let dependencies = [];

        // influenced by
        Object.keys(this.props.problem.properties).forEach(p => {
            dependencies = dependencies.concat(
                Object.keys(this.props.problem.properties[p].influenced_by || {}).map(object => {
                    return {
                        key: object,
                        type: 'i',
                        propertyKey: p,
                        foreignFields: this.props.problem.properties[p].influenced_by[object],
                    }
                })
            );
        });

        // triggered by
        DecisionProblems.forEach(problem => {
            Object.keys(problem.properties).forEach(property => {
                Object.keys(problem.properties[property].triggers || {}).forEach(trigger => {
                    let triggeredProblems = problem.properties[property].triggers[trigger];
                    if (Array.isArray(triggeredProblems) && triggeredProblems.includes(this.props.problem.key)) {
                        dependencies.push({
                            key: problem.key,
                            type: 't',
                            triggeredValue: trigger,
                        });
                    }
                });
            });
        });

        return dependencies;
    }

    calculateScore(alternative, factors, extremeValues) {
        let sumOfWeights = 0;
        let scores = factors
            .filter(factor => factor.weight > 0)
            .map(factor => {
                sumOfWeights += Number(factor.weight);

                let isTimelineType = this.state.propertiesDescription[factor.propertyKey].type === 'timeline';
                let values = isTimelineType ?
                    [alternative.timelines[factor.propertyKey].sum].filter(Boolean) :
                    alternative.properties[factor.propertyKey];

                let propertyScore;
                if (this.state.propertiesDescription[factor.propertyKey].dual) {
                    let isDateType = this.state.propertiesDescription[factor.propertyKey].type === 'date';
                    let leftBoundary = this.getBoundaryValueForScoreCalculation(factor.boundaries.left, extremeValues[factor.propertyKey].min, isDateType);
                    let rightBoundary = this.getBoundaryValueForScoreCalculation(factor.boundaries.right, extremeValues[factor.propertyKey].max, isDateType);
                    propertyScore = this.calculateScoreForIntervalFactor(factor, values, leftBoundary, rightBoundary, isDateType);
                } else {
                    propertyScore = this.calculateScoreForDictionaryFactor(factor, values, extremeValues[factor.propertyKey]);
                }

                if (propertyScore === undefined) {
                    return undefined;
                }
                return Number(factor.weight) * Number(propertyScore);
            });
        if (sumOfWeights === 0 || scores.every(s => s === undefined)) {
            return undefined;
        } else {
            return scores.map(s => s === undefined ? 0 : s).reduce((sum,s) => sum + s, 0) / sumOfWeights;
        }
    }

    calculateScoreForDictionaryFactor(factor, propertyValues, extremeValues) {
        if (propertyValues.length === 0) {
            return undefined;
        }
        switch(factor.strategy) {
            case 'more_better':
            default:
                return propertyValues.length / extremeValues.max;
            case 'less_better':
                return propertyValues.length ? ((extremeValues.max - propertyValues.length + 1) / extremeValues.max) : 0;
            case 'null_better':
                return (extremeValues.max - propertyValues.length) / extremeValues.max;
            case 'custom':
                let myScore = 0;
                let maxPossibleScore = 1;
                factor.customValues.forEach(cv => {
                    if (maxPossibleScore < cv.score) {
                        maxPossibleScore = cv.score;
                    }
                });
                propertyValues.forEach(value => {
                    let cv = factor.customValues.find(cv => cv.value === value);
                    let score = (cv ? cv.score : 1);
                    if (myScore < score) {
                        myScore = score;
                    }
                });
                return myScore / maxPossibleScore;
        }
    }

    calculateScoreForIntervalFactor(factor, propertyValues, leftBoundary, rightBoundary, isDateType) {
        if (leftBoundary === undefined || rightBoundary === undefined || !propertyValues.length) {
            return undefined;
        }
        let interval = rightBoundary - leftBoundary;
        let values = propertyValues.map(v => isDateType ? new Date(v).getTime() : Number(v.toString().replace(/[^\d]/g, '')));
        let bestScore = 0;
        values.forEach(v => {
            let score = (v - leftBoundary) / interval;
            if (factor.strategy === 'min_better') {
                score = 1 - score;
            }
            if (score < 0) {
                score = 0;
            }
            if (score > 1) {
                score = 1;
            }
            if (score > bestScore) {
                bestScore = score;
            }
        });
        return bestScore;
    }

    getBoundaryValueForScoreCalculation(factorBoundary, extremeValue, isDateType) {
        let value;
        if (factorBoundary === undefined) {
            if (extremeValue === undefined) {
                return undefined;
            } else {
                value = extremeValue;
            }
        } else {
            value = factorBoundary;
        }
        if (value !== undefined) {
            return isDateType ? new Date(value).getTime() : Number(value.toString().replace(/[^\d]/g, ''));
        }
    }

    calculateFilters() {
        return Object.keys(this.props.problem.properties).map(propertyKey => (
            {
                propertyKey: propertyKey,
                filter: undefined,
            }
        ));
    }

    calculateFactors() {
        return Object.keys(this.props.problem.properties)
            .filter(propertyKey => propertyKey !== 'label')
            .map(propertyKey => {
                let ap = AlternativesProperties.find(a => a.key === propertyKey);
                return ({
                    propertyKey: propertyKey,
                    weight: ap.default_weight,
                    default_weight: ap.default_weight,
                    strategy: ap.default_strategy,
                    boundaries: {left: undefined, right: undefined},
                    customValues: [],
                })
            });
    }

    getConstraintForProperty(propertyKey) {
        let values = [];
        let influencers = this.state.dependencies.filter(d => d.type === 'i');
        Object.keys(influencers).forEach(i => {
            if (influencers[i].propertyKey === propertyKey // if there is some influencer for this property
            && this.props.choices[influencers[i].key] // and if decision was made in that influencer
            ) {
                values = values.concat(influencers[i].foreignFields.map(field => this.props.choices[influencers[i].key][field]));
            }
        });
        return values;
    }

    sortAlternatives(parameter) {
        parameter = parameter ? parameter : 'score';
        this.setState({
            alternatives: this.state.alternatives.sort((a, b) => {
                switch(parameter) {
                    case 'score':
                        return this.compareProperties([a.score].filter(Boolean), [b.score].filter(Boolean), 'number');
                    default:
                        let valueA = a.properties[parameter];
                        let valueB = b.properties[parameter];
                        if (this.state.propertiesDescription[parameter].type === 'timeline') {
                            valueA = [a.timelines[parameter].sum].filter(Boolean);
                            valueB = [b.timelines[parameter].sum].filter(Boolean);
                        }
                        return this.compareProperties(valueA, valueB, this.state.propertiesDescription[parameter].type);
                }
            }),
            sortBy: parameter,
        });
    }

    compareProperties(a, b, type) {
        if (!a && !b) return 0;
        if (a && !b) return -1;
        if (b && !a) return 1;
        if (a.length === 0) {
            return b.length > 0 ? 1 : 0;
        }
        if (b.length === 0) {
            return a.length > 0 ? -1 : 0;
        }
        a = a.sort()[0];
        b = b.sort()[0];
        switch (type) {
            case 'number':
            case 'timeline':
                return b > a;
            case 'tag':
                a = a.split("/").pop();
                b = b.split("/").pop();
                // falls through
            case 'string':
                return a.trim().toUpperCase() > b.trim().toUpperCase();
            default:
                return a > b;
        }
    }
}
