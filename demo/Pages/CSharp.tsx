import * as React from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { NestedField, IExpression } from '../../src/Models/ExpressionModels';
import { PanelContainer, Panel, Section } from '../Styles';
import { Typography } from '@material-ui/core';
import QueryBuilder from './CSharp/QueryBuilder';
import { HrbFieldLoader } from './CSharp/HrbFieldLoader';
import ExprVisitorCs from './CSharp/ExprVisitorCs';
import styled from 'styled-components';

@observer
export default class CSharp extends React.Component {
    @observable
    private fields: NestedField[] = [];

    @observable
    private expr: { query?: IExpression } = {};

    @observable
    private highlight?: IExpression;

    render() {
        return (
            <PanelContainer>
                <Panel width={450}>
                    <Section pad>Demo</Section>
                    <HrbFieldLoader onChange={fields => (this.fields = fields)} />
                </Panel>
                <Panel width="lg">
                    <QueryBuilder fields={this.fields} onChange={expr => (this.expr = expr)} highlight={this.highlight} />
                    <Section pad>
                        <Typography>C# Preview</Typography>
                    </Section>
                    <Section pad style={{ maxHeight: '300px' }}>
                        <CSharpPreview>{ExprVisitorCs.visit(this.expr.query, expr => (this.highlight = expr))}</CSharpPreview>
                    </Section>
                </Panel>
            </PanelContainer>
        );
    }
}

const CSharpPreview = styled.div`
    white-space: pre;
    font-family: monospace;
    font-size: 1.1rem;
`;
