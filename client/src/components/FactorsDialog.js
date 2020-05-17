import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Creatable from 'react-select/creatable';
import Select from 'react-select';

import * as Config from '../constans/FormParams';
import * as Strategies from '../constans/WeightingStrategies';

export default class FactorsDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            factors: this.props.factors,
        }

        this.handleClose = this.handleClose.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.onSelectStrategyChange = this.onSelectStrategyChange.bind(this);
        this.onSelectValueAdd = this.onSelectValueAdd.bind(this);
        this.onSelectValueChange = this.onSelectValueChange.bind(this);
        this.onFocusOut = this.onFocusOut.bind(this);
    }

    render() {
        return (
            <Modal 
                show={this.props.show}
                onHide={this.handleClose}
                animation={false}
                dialogClassName="modal-factors"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Weighting factors</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {this.renderBody()}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={this.handleClose}>Close</Button>
                    <Button id="btn-apply" variant="primary" onClick={this.handleClose}>Apply</Button>
                </Modal.Footer>
            </Modal>
        );
    }

    renderBody() {
        return (
            <Table responsive>
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Weighting factor</th>
                        <th>Strategy</th>
                        <th>Additional settings</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.factors.map(factor => this.renderFactor(factor))}
                </tbody>
            </Table>
        );
    }

    renderFactor(factor) {
        let property = this.props.propertiesDescription[factor.propertyKey];
        let strategies = property.dual ? Strategies.INTERVAL_STRATEGIES : Strategies.DICTIONARY_STRATEGIES;
        return (
            <tr>
                <td>
                    {property.name}
                </td>
                <td>
                    <InputGroup className={"form-input-weight"} >
                        <Form.Control
                            type="text"
                            fieldType="weight"
                            propertyKey={factor.propertyKey}
                            value={factor.weight}
                            onChange={this.onInputChange}
                            onBlur={this.onFocusOut}
                        />
                        <InputGroup.Append>
                            <Button
                                propertyKey={factor.propertyKey}
                                variant="outline-secondary"
                                fieldType="weight"
                                disabled={Number(factor.weight) === factor.default_weight}
                                onClick={this.onFocusOut}
                            >Reset</Button>
                        </InputGroup.Append>
                    </InputGroup>
                </td>
                <td>
                    <Select
                        propertyKey={factor.propertyKey}
                        options={strategies.map(s => ({...s, propertyKey:factor.propertyKey}))}
                        className={"form-select-strategy"}
                        isSearchable={false}
                        value={strategies.find(s => s.value === factor.strategy)}
                        onChange={this.onSelectStrategyChange}
                    />
                </td>
                <td>
                    {this.renderSettingsFields(factor, property.dual)}
                </td>
            </tr>
        );
    }

    renderSettingsFields(factor, forIntervalType) {
        if (forIntervalType) {
            return (
                <Form>
                    <Form.Row>
                        <Form.Group as={Col} sm={6}>
                            <InputGroup>
                                <Form.Control
                                    propertyKey={factor.propertyKey}
                                    placeholder="Left boundary"
                                    fieldType="left"
                                    value={factor.boundaries.left}
                                    onChange={this.onInputChange}
                                    onBlur={this.onFocusOut}
                                />
                                <InputGroup.Append>
                                    <Button
                                        propertyKey={factor.propertyKey}
                                        variant="outline-secondary"
                                        fieldType="left"
                                        disabled={!factor.boundaries.left}
                                        onClick={this.onFocusOut}
                                    >Clear</Button>
                                </InputGroup.Append>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group as={Col} sm={6}>
                            <InputGroup>
                                <Form.Control
                                    propertyKey={factor.propertyKey}
                                    placeholder="Right boundary"
                                    fieldType="right"
                                    value={factor.boundaries.right}
                                    onChange={this.onInputChange}
                                    onBlur={this.onFocusOut}
                                />
                                <InputGroup.Append>
                                    <Button
                                        propertyKey={factor.propertyKey}
                                        variant="outline-secondary"
                                        fieldType="right"
                                        disabled={!factor.boundaries.right}
                                        onClick={this.onFocusOut}
                                    >Clear</Button>
                                </InputGroup.Append>
                            </InputGroup>
                        </Form.Group>
                    </Form.Row>
                </Form>
            );
        } else {
            let selectedValue = factor.customValues.find(v => v.value === this.state['sel-' + factor.propertyKey]);
            return (
                <Form>
                    <Form.Row>
                        <Form.Group as={Col} sm={9}>
                            <Creatable
                                type="text"
                                propertyKey={factor.propertyKey}
                                placeholder="Value"
                                options={factor.customValues.map(v => ({
                                    value: v.value,
                                    label: v.value,
                                }))}
                                value={selectedValue ? {
                                    value: selectedValue.value,
                                    label: selectedValue.value
                                } : ""}
                                isClearable={true}
                                onChange={value => {this.onSelectValueChange({propertyKey: factor.propertyKey, selected: value})}}
                                onCreateOption={value => {this.onSelectValueAdd({propertyKey: factor.propertyKey, value: value})}}
                            />
                        </Form.Group>
                        <Form.Group as={Col} sm={3}>
                            <Form.Control
                                propertyKey={factor.propertyKey}
                                placeholder="Score"
                                fieldType="score"
                                value={selectedValue ? selectedValue.score : ""}
                                disabled={!selectedValue}
                                onChange={this.onInputChange}
                                onBlur={this.onFocusOut}
                            />
                        </Form.Group>
                    </Form.Row>
                </Form>
            );
        }
    }

    onInputChange(event) {
        let value = event.target.value;
        let propertyKey = event.target.getAttribute('propertykey');
        let fieldType = event.target.getAttribute('fieldtype');
        let factor = this.getFactor(propertyKey);
        switch(fieldType) {
            case 'score':
            case 'weight':
                value = value
                    .replace(/ /g, '') // remove spaces
                    .replace(/,/g, '.'); // allowed only dots
                if (Config.FILTER_NUMBER_VALUES_REGEX.test(value)) {
                    if (fieldType === 'score') {
                        fieldType = 'customValues';
                        value = factor.customValues.map(cv => {
                            if (cv.value === this.state['sel-' + factor.propertyKey]) {
                                cv.score = value;
                            }
                            return cv;
                        });
                    }
                    this.saveFactorField(propertyKey, fieldType, value);
                }
                break;
            case 'left':
            case 'right':
                let boundaries = factor.boundaries;
                if (this.props.propertiesDescription[propertyKey].type === 'date') {
                    value = value
                        .replace(/[,.\- ]/g, '/') // allowed only slashes
                        .replace(/\/([0-9])\//, "/0$1/"); // month leading zero
                    if (value && !Config.FILTER_DATE_INPUT_VALUES_REGEX.test(value)) {
                        return;
                    }
                } else {
                    value = value.replace(/[^\d]/g, ''); // allowed only digits
                }
                boundaries[fieldType] = value;
                this.saveFactorField(propertyKey, fieldType, boundaries);
                break;
            default:
        }
    }

    onSelectStrategyChange(selected) {
        if (selected && selected.value) {
            this.saveFactorField(selected.propertyKey, 'strategy', selected.value);
        }
    }

    onSelectValueAdd(event) {
        if (event && event.value) {
            let values = this.getFactor(event.propertyKey).customValues;
            if (!values.find(v => v.value === event.value)) {
                values.push({value: event.value, score: 1});
                this.saveFactorField(event.propertyKey, 'customValues', values);
                this.setState({['sel-' + event.propertyKey]: event.value});
            }
        }
    }

    onSelectValueChange(event) {
        if (event && event.propertyKey) {
            if (event.selected) {
                this.setState({['sel-' + event.propertyKey]: event.selected.label});
            } else {
                let currentSelect = this.state['sel-' + event.propertyKey];
                if (currentSelect) {
                    let values = this.getFactor(event.propertyKey).customValues;
                    this.setState({['sel-' + event.propertyKey]: undefined});
                    values = values.filter(v => v.value !== currentSelect);
                    this.saveFactorField(event.propertyKey, 'customValues', values);
                }
            }
        }
    }

    handleClose(event) {
        let newFactors;
        if (event && (event.currentTarget||{}).id === 'btn-apply') {
            newFactors = this.state.factors;
        }
        this.props.applyFactors(newFactors);
    }

    onFocusOut(event) {
        let value = event.target.value;
        let propertyKey = event.target.getAttribute('propertykey');
        let fieldType = event.target.getAttribute('fieldType');
        switch(fieldType) {
            case 'score':
            case 'weight':
                if (!value) {
                    value = this.getDefaultValueForInput(propertyKey, fieldType);
                }
                value = Number(value).toString();
                break;
            case 'left':
            case 'right':
                let boundaries = this.getFactor(propertyKey).boundaries;
                if (value && this.props.propertiesDescription[propertyKey].type === 'date') {
                    value = this.getValidDateString(value, fieldType === 'left');
                }
                boundaries[fieldType] = value;
                value = boundaries;
                break;
            default:
        }
        this.saveFactorField(propertyKey, fieldType, value);
    }

    getDefaultValueForInput(propertyKey, fieldType) {
        switch(fieldType) {
            case 'weight':
                return this.state.factors.find(f => f.propertyKey === propertyKey).default_weight;
            case 'score':
                return 1;
            default:
                return "";
        }
    }

    saveFactorField(propertyKey, field, value) {
        this.setState(state => {
            const factors = state.factors.map(f => {
                if (f.propertyKey === propertyKey) {
                    f[field] = value;
                }
                return f;
            });
            return {factors};
        });
    }

    getFactor(propertyKey) {
        return this.state.factors.find(f => f.propertyKey === propertyKey);
    }

    getValidDateString(string, isDateFrom) {
        if (string) {
            string = string.split('/');
            let year;
            let month;
            let day;

            // year
            if (string[0].length === 4) {
                year = string[0];
            } else {
                if (string[0] < 100) {
                    year = Number(string[0]) + 2000;
                } else {
                    return;
                }
            }

            // month
            if (string[1]) {
                month = string[1];
            } else {
                month = isDateFrom ? "01" : "12";
            }

            // day
            if (string[2]) {
                day = string[2] > 31 ? "31" : string[2];
            } else {
                day = isDateFrom ? "01" : "31";
            }

            if (!isDateFrom) {
                for (; day > 28; day--) {
                    if (this.isValidDate(year, month, day)) {
                        break;
                    }
                }
            }
            return year + "/" + this.pad(month, 2) + "/" + this.pad(day, 2);
        }
    }

    isValidDateString(string) {
        let date = string.split('/'); // YYYY/MM/DD
        if (date.length === 3) {
            return this.isValidDate(date[0], date[1], date[2]);
        }
        return false;
    }

    isValidDate(year, month, day) {
        let date = new Date();
        date.setFullYear(year, month - 1, day);

        return date.getFullYear() === year 
            && date.getMonth() === month - 1
            && date.getDate() === day;
    }

    pad(num, size) {
        let s = num + "";
        while (s.length < size) {
            s = "0" + s;
        }
        return s;
    }
}