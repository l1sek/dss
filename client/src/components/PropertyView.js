import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';
import VisGraph2d from "react-visjs-graph2d";

import AlternativesProperties from '../AlternativesProperties.json';

export default class PropertyView extends Component {
    render() {
        let propertyDefinition = AlternativesProperties.find(element => element.key === this.props.propertyKey) || {};
        let values = this.props.value || [];

        switch (propertyDefinition.type) {
            case 'timeline':
                if (values.length) {
                    values = values.map(v => ({
                        x: new Date(v.year, 6, 1),
                        y: v.total,
                        label: {
                            content: v.total,
                            xOffset: 5,
                            yOffset: -5,
                        },
                    }));
                }
                break;
            case 'date':
                values = values.map(date => {
                    if (date && date.trim()) {
                        return new Date(date.trim()).toLocaleDateString();
                    }
                    return "";
                });
                break;
            case 'website':
                values = values.map(url => <a href={url.trim()} target={"blank_"}>{url.trim()}</a>)
                break;
            case 'tag':
                values = values.map(tag => <a href={tag.trim()} target={"blank_"}>{decodeURIComponent(tag.trim().split("/").pop())}</a>)
                break;
            default:
                // do nothing for other types
        }

        let content;
        if (propertyDefinition.type === 'timeline') {
            let options = {
                interpolation: {
                    parametrization: 'chordal',
                },
                dataAxis: {
                    left: {
                        title: {
                            text: 'Number of events',
                        }
                    }
                },
                start: '1900',
                end: (new Date().getFullYear() + 1).toString(),
                locale: 'en',
            };

            content = <VisGraph2d options={options} items={values} />
        } else {
            content = <ul>{values.map(v => <li>{v}</li>)}</ul>;
        }

        return (
            <Modal
                show={this.props.show}
                onHide={this.props.onHide}
                onExit={e => this.setState({doit: false})}
                onEntered={e => this.setState({isVisible: true})}
                dialogClassName={propertyDefinition.type === 'timeline' ? 'modal-graph' : 'modal-dialog'}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{this.props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {content}
                </Modal.Body>
            </Modal>
        );
    }
}