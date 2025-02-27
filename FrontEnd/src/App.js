import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegistrationForm from './components/RegistrationForm';

function App() {
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/login" component={LoginForm} />
          <Route path="/register" component={RegistrationForm} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
