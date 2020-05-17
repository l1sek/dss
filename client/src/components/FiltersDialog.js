import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';

import CreatableInput from './CreatableInput';

import * as Config from '../constans/FormParams';

export default class FiltersDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filters: this.clone(this.props.filters),
        }

        this.onChange = this.onChange.bind(this);
        this.onFocusOut = this.onFocusOut.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.saveFilterField = this.saveFilterField.bind(this);
    }

    render() {
        return (
            <Modal 
                show={this.props.show}
                onHide={this.handleClose}
                animation={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Filters</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {this.renderBody()}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={this.handleClose}>Cancel</Button>
                    <Button id="btn-apply" variant="primary" onClick={this.handleClose}>Apply</Button>
                </Modal.Footer>
            </Modal>
        );
    }

    renderBody() {
        return (
            <Form>
                {this.state.filters.map(f => 
                    <Form.Row>
                        <Form.Group as={Col} sm={3}>
                            <Form.Label className="filter-name">{this.props.propertiesDescription[f.propertyKey].name}</Form.Label>
                        </Form.Group>
                        {this.renderFormGroup(f)}
                    </Form.Row>
                )}
            </Form>
        );
    }

    renderFormGroup(filter) {
        let dual = this.props.propertiesDescription[filter.propertyKey].dual;
        let filterFrom = (filter.filter||{}).from || "";
        let filterTo = (filter.filter||{}).to || "";
        let filterValues = (filter.filter||{}).values || [];
        return (
            <React.Fragment>
                {this.renderInputGroup(filter.propertyKey, dual ? filterFrom : filterValues)}
                {dual ? this.renderInputGroup(filter.propertyKey, filterTo, true) : ""}
            </React.Fragment>
        );
    }

    renderInputGroup(propertyKey, inputValue, isSecondField) {
        let type = this.props.propertiesDescription[propertyKey].type;
        let dual = this.props.propertiesDescription[propertyKey].dual;

        if (dual) {
            let placeholder;
            if (type === 'date') {
                placeholder = "YYYY/MM/DD";
            } else {
                placeholder = isSecondField ? "End value" : "Start value";
            }
            return (
                <Form.Group as={Col} sm={4}>
                    <Form.Label className="filter-label" size="sm">{isSecondField ? "To" : "From"}</Form.Label>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            value={inputValue}
                            placeholder={placeholder}
                            propertyKey={propertyKey}
                            onChange={this.onChange}
                            onBlur={this.onFocusOut}
                            secondField={isSecondField ? "true" : "false"}
                        />
                        <InputGroup.Append>
                            <Button
                                variant="outline-secondary"
                                propertyKey={propertyKey}
                                secondField={isSecondField ? "true" : "false"}
                                disabled={!inputValue.length}
                                onClick={this.onFocusOut}
                            >Clear</Button>
                        </InputGroup.Append>
                    </InputGroup>
                    <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                </Form.Group>
            );
        } else {
            return (
                <Form.Group as={Col} sm={8}>
                    <Form.Label className="filter-label" size="sm">Values</Form.Label>
                    <InputGroup>
                        <CreatableInput
                            value={inputValue}
                            propertyKey={propertyKey}
                            saveFilterFieldFunction={this.saveFilterField}
                        />
                    </InputGroup>
                </Form.Group>
            );
        }
    }

    onChange(event) {
        let value = event.target.value;
        let propertyKey = event.target.getAttribute('propertykey');
        let secondField = event.target.getAttribute('secondfield') === "true";
        
        let oldFilter = this.state.filters.find(f => f.propertyKey === propertyKey).filter;
        let newFilter = oldFilter || {}; // copying structure to adjust
        
        switch (this.props.propertiesDescription[propertyKey].type) {
            case 'number':
                value = value
                    .replace(/ /g, '') // remove spaces
                    .replace(/,/g, '.'); // allowed only dots
                if (value && !Config.FILTER_NUMBER_VALUES_REGEX.test(value)) {
                    return;
                }
                break;
            case 'date':
                value = value
                    .replace(/[,.\- ]/g, '/') // allowed only slashes
                    .replace(/\/([0-9])\//, "/0$1/"); // month leading zero
                if (value && !Config.FILTER_DATE_INPUT_VALUES_REGEX.test(value)) {
                    return;
                }
                break;
            default:
        }
        newFilter[(secondField ? 'to' : 'from')] = value;

        this.saveFilter(propertyKey, newFilter);
    }

    onFocusOut(event) {
        let propertyKey = event.target.getAttribute('propertykey');
        let isSecondField = event.target.getAttribute('secondfield') === "true";
        this.saveFilterField(propertyKey, event.target.value, isSecondField);
    }

    saveFilterField(propertyKey, value, isSecondField) {
        let filter = this.state.filters.find(f => f.propertyKey === propertyKey).filter || {};
        let dual = this.props.propertiesDescription[propertyKey].dual;
        let key = dual ? (isSecondField ? 'to' : 'from') : 'values';
        if (dual) {
            switch (this.props.propertiesDescription[propertyKey].type) {
                case 'date':
                    value = this.getValidDateString(value, !isSecondField);
                    break;
                case 'number':
                default:
            }
            value = value || "";
        } else {
            value = Array.isArray(value) ? value : [];
        }
        filter[key] = value;
        this.saveFilter(propertyKey, filter);
    }

    saveFilter(propertyKey, filter) {
        this.setState(state => {
            const filters = state.filters.map(f => {
                if (f.propertyKey === propertyKey) {
                    f.filter = this.isEmpty(filter) ? undefined : filter;
                }
                return f;
            });
            return {filters};
        });
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

    handleClose(event) {
        let newFilters;
        if (event && (event.currentTarget||{}).id === 'btn-apply') {
            newFilters = this.state.filters.map(f => {
                if (f.filter) {
                    for (var i in f.filter) {
                        if (Array.isArray(f.filter[i])) {
                            f.filter[i] = f.filter[i]
                                .map(str => str.trim()) // trim every element in the array
                                .filter(str => str);   // remove empty strings from the array
                        }
                        if (this.isEmpty(f.filter[i])) {
                            delete f.filter[i];
                        }
                    }
                    if (this.isEmpty(f.filter)) {
                        f.filter = undefined;
                    }
                }
                return f;
            });
        } else {
            this.setState({
                filters: this.clone(this.props.filters), // set old filers
            });
        }
        return this.props.applyFilters(this.clone(newFilters));
    }

    isEmpty(object) { 
        for (var i in object) { 
            return false;
        }
        return true;
    }

    pad(num, size) {
        let s = num + "";
        while (s.length < size) {
            s = "0" + s;
        }
        return s;
    }

    clone(obj) {
        if (obj === undefined) {
            return undefined;
        } else {
            return JSON.parse(JSON.stringify(obj));
        }
    }
}