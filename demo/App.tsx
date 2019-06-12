import * as React from 'react';
import { render } from 'react-dom';
import Demo from './Pages/Demo';
import CSharp from './Pages/CSharp';
import { CssBaseline } from '@material-ui/core';
import { GlobalStyle } from './Styles';

function App() {
    return (
        <>
            <CssBaseline />
            <GlobalStyle />
            <CSharp />
        </>
    );
}

export function init() {
    render(<App />, document.getElementById('app'));
}
