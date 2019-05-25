import * as React from 'react';
import { render } from 'react-dom';
import Demo from './Pages/Demo';
import { CssBaseline } from '@material-ui/core';
import { createGlobalStyle } from 'styled-components';

function App() {
    return (
        <>
            <CssBaseline />
            <GlobalStyle />
            <Demo />
        </>
    );
}

export function init() {
    render(<App />, document.getElementById('app'));
}

const GlobalStyle = createGlobalStyle`
    html, body {
        background: #06e5;
    }
`;
