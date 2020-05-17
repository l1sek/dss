import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';

import ReactJson from 'react-json-view'

export default class JsonView extends Component {
    render() {
        return (
            <Modal
                show={this.props.show}
                onHide={this.props.onHide}
                dialogClassName="modal-dialog"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{this.props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ReactJson
                        src={this.props.content}
                        displayDataTypes={false}
                        indentWidth={6}
                    />
                </Modal.Body>
            </Modal>
        );
    };
}