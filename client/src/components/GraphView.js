import React, { Component, createRef } from 'react';
import { DataSet, Network } from 'vis';
import Modal from 'react-bootstrap/Modal';

import DecisionProblems from '../DecisionProblems.json';

export default class GraphView extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nodes: this.calculateNodes(),
            edges: this.calculateEdges(),
        }
    }

    render() {
        return (
            <Modal
                show={this.props.show}
                onHide={this.props.onHide}
                dialogClassName="modal-graph"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Graph Visualisation of Model of Decision Problem</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <VisNetwork 
                        nodes={this.state.nodes}
                        edges={this.state.edges}
                    />
                </Modal.Body>
            </Modal>
        );
    }

    calculateNodes() {
        return new DataSet(Object.keys(DecisionProblems).map(decision => 
            ({
                id: DecisionProblems[decision].key,
                label: DecisionProblems[decision].name,
            })
        ));
    }

    calculateEdges() {
        let edges = [];
        Object.keys(DecisionProblems).forEach(decision => {
            Object.keys(DecisionProblems[decision].properties).forEach(property => {
                // triggers
                Object.keys(DecisionProblems[decision].properties[property].triggers || {}).forEach(trigger => {
                    let triggered = DecisionProblems[decision].properties[property].triggers[trigger];
                    if (Array.isArray(triggered)) {
                        triggered.forEach(t => {
                            edges.push({
                                from: DecisionProblems[decision].key,
                                to: t,
                                dashes: true, 
                                arrows: {to: true}, 
                                color: '#848484'
                            });
                        });
                    }
                });

                // affects
                Object.keys(DecisionProblems[decision].properties[property].influenced_by || {}).forEach(influenced => {
                    if (Array.isArray(DecisionProblems[decision].properties[property].influenced_by[influenced])) {
                        edges.push({
                            from: influenced,
                            to: DecisionProblems[decision].key,
                            arrows: {to: true},
                        });
                    }
                });
            });
        });
        return new DataSet(edges);
    }
}

class VisNetwork extends Component {
    constructor(props) {
      super(props);

      this.network = {};
      this.appRef = createRef();
    }
  
    componentDidMount() {
        let data = {
            nodes: this.props.nodes,
            edges: this.props.edges
        };
        let options = {
            nodes: {
                shape: 'box',
            },
            edges: {

            },
        };
        this.network = new Network(this.appRef.current, data, options);
    }
  
    render() {
      return (
        <div id="graph-container" ref={this.appRef} />
      );
    }
  }