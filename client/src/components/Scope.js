import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';

import Decision from './Decision';
import AddDecisionInputGroup from './AddDecisionInputGroup';

import * as Config from '../constans/FormParams';
import DecisionProblems from '../DecisionProblems.json';

export default class Scope extends Component {
    constructor(props) {
        super(props);

        this.state = {
            decisions: [],
            choices: {},
            newDecisionTypeValid: false,
            newDecisionNameValid: false,
            newScopeNameValid: false,
        }

        this.handleScopeNameInputValueChange = this.handleScopeNameInputValueChange.bind(this);
        this.handleAddScopeButtonClick = this.handleAddScopeButtonClick.bind(this);

        this.addDecision = this.addDecision.bind(this);
        this.changeDecision = this.changeDecision.bind(this);
        this.deleteDecision = this.deleteDecision.bind(this);
    }

    /*
     ************ RENDERERS ************
     */

    render() {
        if (this.props.stub) {
            return this.renderStub();
        }
        return (
            <div className="dec-scope">
                <Form inline className="justify-content-between">
                    <h4 className="dec-scope-title">
                        <span>Scope of decisions</span>: <span>{this.props.name}</span>
                    </h4>
                    <AddDecisionInputGroup
                        addDecisionHandler={this.addDecision}
                        addedDecisionProblems={this.state.decisions.map(d => d.problemKey)}
                    />
                </Form>
                {this.state.decisions.map(dec =>
                    <Decision
                        key={dec.created}
                        name={dec.name}
                        type={dec.type}
                        problem={DecisionProblems.find(d => d.key === dec.problemKey)}
                        choices={this.state.choices}
                        onDecisionChange={this.changeDecision}
                        onDecisionDelete={this.deleteDecision}
                    />
                )}
            </div>
        );
    }

    renderStub() {
        return (
            <div className="dec-scope-stub">
                <InputGroup>
                    <FormControl
                        placeholder="Name of a new scope"
                        aria-label="Name of a new scope"
                        maxLength={Config.SCOPE_NAME_MAX_LENGTH}
                        aria-describedby="basic-addon2"
                        ref={(ref) => this.nameOfNewScopeInput = ref}
                        onChange={this.handleScopeNameInputValueChange}
                    />
                    <InputGroup.Append>
                        <Button 
                            variant="outline-secondary"
                            onClick={this.handleAddScopeButtonClick}
                            disabled={!this.state.newScopeNameValid}
                            >Add</Button>
                    </InputGroup.Append>
                </InputGroup>
            </div>
        );
    }

    /*
     ************ HANDLERS ************
     */
    handleScopeNameInputValueChange(event) {
        var input = event.currentTarget;
        if (input.value) {
            if (input.value.length >= Config.SCOPE_NAME_MIN_LENGTH 
             && input.value.length <= Config.SCOPE_NAME_MAX_LENGTH) {
                // check if exist
                this.setState({newScopeNameValid: true});
            } else {
                this.setState({newScopeNameValid: false});
            }
        }
    }

    handleAddScopeButtonClick(event) {
        if (this.state.newScopeNameValid) {
            this.props.addScopeHandler(this.nameOfNewScopeInput);
            this.setState({newScopeNameValid: false});
        }
    }

    addDecision(type, name) {
        if (this.state.decisions.find(d => d.problemKey === type.value)) {
            return; // don't add the same decision problem as already added
        }
        this.setState({
            decisions: this.state.decisions.concat([
                {
                    created: Date.now(),
                    name: name,
                    problemKey: type.value,
                    newScopeNameValid: false,
                }
            ])
        });
    }

    changeDecision(decision) {
        let problem = DecisionProblems.find(d => d.key === decision.problemKey);
        let triggers = problem.properties.label.triggers || {};

        let decisionsToAdd = [];
        let decisionsToRemove = [];
        if (decision.value) {
            let label = decision.value.label;

            if (triggers._blocking === true) {
                Object.keys(triggers).forEach(t => {
                    if (Array.isArray(triggers[t])) {
                        triggers[t].forEach(problemKey => {
                            let alreadyAdded = this.state.decisions.find(d => d.problemKey === problemKey);
                            if (alreadyAdded) {
                                decisionsToRemove.push(alreadyAdded.problemKey);
                            }
                        });
                    }
                });
            }

            decisionsToAdd = (triggers[label] || [])
                .filter(t => !this.state.decisions.find(d => d.problemKey === t))
                .map(t => ({
                    created: Date.now(),
                    name: "Automatically added",
                    problemKey: t,
                }));
        }
        let newDecisionsSet = this.state.decisions;
        if (decisionsToAdd.length) {
            newDecisionsSet = newDecisionsSet.concat(decisionsToAdd);
            if (triggers._blocking === true) {
                newDecisionsSet = newDecisionsSet.filter(d => !decisionsToRemove.includes(d.problemKey));
            }
        }
        
        this.setState((prevState) => ({
            choices: {...prevState.choices, [decision.problemKey]: decision.value},
            decisions: newDecisionsSet,
        }));
    }

    deleteDecision(decision) {
        let decisions = this.state.decisions.filter(d => d.problemKey !== decision.problemKey);
        let choices = {...this.state.choices, [decision.problemKey]: undefined};
        this.setState({
            decisions: decisions,
            choices: choices,
        });
    }
}