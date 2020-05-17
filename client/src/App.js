import React, { Component } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

import GraphView from './components/GraphView';
import JsonView from './components/JsonView';
import Scope from './components/Scope';

import * as Config from './constans/FormParams';

import DecisionProblems from './DecisionProblems.json';
import Properties from './AlternativesProperties.json';
import './App.css';

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      scopes: [],
      showDecisions: false,
      showProperties: false,
    };

    this.addNewScope = this.addNewScope.bind(this);
    this.handleGraphShow = this.handleGraphShow.bind(this);
    this.handleGraphHide = this.handleGraphHide.bind(this);
    this.handleDecisionsJSONShow = this.handleDecisionsJSONShow.bind(this);
    this.handleDecisionsJSONHide = this.handleDecisionsJSONHide.bind(this);
    this.handlePropertiesJSONShow = this.handlePropertiesJSONShow.bind(this);
    this.handlePropertiesJSONHide = this.handlePropertiesJSONHide.bind(this);
  }

  render() {
    return (
      <React.Fragment>
        <div className="App">
          {this.renderBar()}
          {this.state.scopes.map((scope) =>
            <Scope
              key={scope}
              name={scope}
            />
          )}
          <Scope stub allScopes={this.state.scopes} addScopeHandler={this.addNewScope} />
        </div>

        <JsonView
          title="Decision problems model"
          content={DecisionProblems}
          show={this.state.showDecisions}
          onHide={this.handleDecisionsJSONHide}
        />
        <JsonView
          title="Properties model"
          content={Properties}
          show={this.state.showProperties}
          onHide={this.handlePropertiesJSONHide}
        />
        <GraphView
          show={this.state.showGraph}
          onHide={this.handleGraphHide}
        />
      </React.Fragment>
    );
  }

  renderBar() {
    return (
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">Decision Support System</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="#graph" onClick={this.handleGraphShow}>Graph</Nav.Link>
            <NavDropdown title="Options" id="basic-nav-dropdown">
              <NavDropdown.Item href="#edit/decisions" onClick={this.handleDecisionsJSONShow}>Decisions JSON</NavDropdown.Item>
              <NavDropdown.Item href="#edit/properties" onClick={this.handlePropertiesJSONShow}>Properties JSON</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="/">Reset</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }

  addNewScope(nameOfNewScopeInput) {
    var name = nameOfNewScopeInput.value;
    if (name
      && name.length >= Config.SCOPE_NAME_MIN_LENGTH
      && name.length <= Config.SCOPE_NAME_MAX_LENGTH) {
      this.setState({
        scopes: this.state.scopes.concat([name])
      });
    }
    nameOfNewScopeInput.value = null;
  }

  handleGraphShow() {
    this.setState({ showGraph: true });
  }

  handleGraphHide() {
    this.setState({ showGraph: false });
  }

  handleDecisionsJSONShow() {
    this.setState({ showDecisions: true });
  }

  handleDecisionsJSONHide() {
    this.setState({ showDecisions: false });
  }

  handlePropertiesJSONShow() {
    this.setState({ showProperties: true });
  }

  handlePropertiesJSONHide() {
    this.setState({ showProperties: false });
  }
}

