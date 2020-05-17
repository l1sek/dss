import React, { Component } from 'react';
import CreatableSelect from 'react-select/creatable';

export default class FiltersDialog extends Component {
    state = {inputValue: ''};

    render() {
        let value = (this.props.value||[]).map(v => ({
            label: v,
            value: v,
        }));
        return (
            <CreatableSelect
                className="filter-creatable-input"
                components={{
                    DropdownIndicator: null,
                }}
                inputValue={this.state.inputValue}
                isClearable
                isMulti
                menuIsOpen={false}
                onChange={val => this.handleChange((val||[]).map(v => v.label))}
                onInputChange={this.handleInputChange}
                onKeyDown={this.handleKeyDown}
                placeholder="Type something and press enter..."
                value={value}
            />
        );
    }

    handleChange = (value) => {
        //console.log(value)
        this.props.saveFilterFieldFunction(this.props.propertyKey, value);
    };

    handleInputChange = (inputValue) => {
        this.setState({ inputValue });
    };

    handleKeyDown = (event) => {
        let inputValue = this.state.inputValue;
        if (!inputValue) return;
        switch (event.key) {
            case 'Enter':
            case 'Tab':
                this.setState({inputValue: ''});
                event.preventDefault();
                this.handleChange([...this.props.value, inputValue]);
                break;
            default:
        }
    };
}