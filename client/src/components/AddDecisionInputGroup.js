import React, { Component } from "react";
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Select from 'react-select';

import * as Config from '../constans/FormParams';

import DecisionProblems from '../DecisionProblems.json';

export default class AddDecisionInputGroup extends Component {
    constructor(props) {
        super(props);

        this.state = {
            newDecisionTypeValid: false,
            newDecisionNameValid: false,
        }

        this.handleDecisionTypeSelect = this.handleDecisionTypeSelect.bind(this);
        this.handleDecisionNameChange = this.handleDecisionNameChange.bind(this);
        this.handleAddDecisionClick = this.handleAddDecisionClick.bind(this);
    }

    render() {
        return (
            <InputGroup className="mb-3">
                <Select
                    as="select"
                    options={DecisionProblems.map(d => (
                        {
                            value: d.key,
                            label: d.name,
                            isDisabled: this.props.addedDecisionProblems.includes(d.key),
                        }
                    ))}
                    placeholder="Decision type"
                    className="nav-search-input"
                    ref={(ref) => this.decisionTypeSelect = ref}
                    onChange={this.handleDecisionTypeSelect}
                />
                <InputGroup>
                    <FormControl
                        placeholder="Decision name"
                        maxLength={Config.DECISION_NAME_MAX_LENGTH}
                        ref={(ref) => this.decisionNameInput = ref}
                        onChange={this.handleDecisionNameChange}
                        disabled={!this.state.newDecisionTypeValid}
                    />
                </InputGroup>
                <Button
                    onClick={this.handleAddDecisionClick}
                    disabled={!this.state.newDecisionNameValid}
                >Add</Button>
            </InputGroup>
        )
    }

    handleDecisionTypeSelect(event) {
        let isOk = (event && event.value ? true : false);
        this.setState({newDecisionTypeValid: isOk, newDecisionNameValid: false});
        this.decisionNameInput.value = '';
    }

    handleDecisionNameChange(event) {
        let value = event.currentTarget.value;
        let isOk = false;
        if (value
         && value.length >= Config.DECISION_NAME_MIN_LENGTH
         && value.length <= Config.DECISION_NAME_MAX_LENGTH
        ) {
            isOk = true;
        }
        this.setState({newDecisionNameValid: isOk});
    }

    handleAddDecisionClick(event) {
        if (this.state.newDecisionTypeValid && this.state.newDecisionNameValid) {
            let type = this.decisionTypeSelect.state.value;
            let name = this.decisionNameInput.value;
            this.props.addDecisionHandler(type, name);
        }
        this.decisionTypeSelect.select.clearValue();
    }
}