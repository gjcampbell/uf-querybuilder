import * as React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

export const colors = {
    border: {
        faint: '#0002'
    }
};
export const common = {
    shadow: {
        default: '0 0 15px #0005'
    }
};

const panelWidths = { sm: 300, md: 600, lg: 900 };

export const Panel = styled.div<{ width?: 'sm' | 'md' | 'lg' | number }>`
    border-right: solid 1px ${colors.border.faint};
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
    box-shadow: ${common.shadow.default};
    clip-path: inset(0 0 0 -15px);
    flex: 0 0 ${p => (typeof p.width === 'number' ? p.width : typeof p.width === 'string' ? panelWidths[p.width] : 300)}px;
`;

export const Section = styled.div<{ fill?: boolean; pad?: boolean }>`
    padding: ${p => (p.pad ? '10px 20px' : '0')};
    flex: ${p => (p.fill ? '1 1 100%' : '0 0 auto')};
    border-bottom: solid 1px ${colors.border.faint};
    overflow: auto;
`;

export const PanelContainer = styled.div`
    display: flex;
    height: 100%;
`;

export const GlobalStyle = createGlobalStyle`
    html, body, #app {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
    }
`;
